import { db } from '../db/init.js';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../types/index.js';
import { generateOrderId, generateOrderItemId, generateOrderCode } from '../utils/id.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { CreateOrderInput, UpdateOrderStatusInput } from '../schemas/index.js';
import { productService } from './product.service.js';

export class OrderService {
  private TAX_RATE = parseFloat(process.env.TAX_RATE || '0.21');

  createOrder(input: CreateOrderInput): Order {
    const orderId = generateOrderId();
    const code = generateOrderCode();
    const now = new Date().toISOString();

    // Calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    // Validate and fetch all products
    for (const item of input.items) {
      const product = productService.getProductBySku(item.sku);
      if (!product) {
        throw new ValidationError(`Product with SKU ${item.sku} not found`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product,
        quantity: item.quantity,
        color: item.color,
      });
    }

    const tax = Math.round(subtotal * this.TAX_RATE * 100) / 100;
    const total = subtotal + tax;

    try {
      // Insert order
      const stmt = db.prepare(`
        INSERT INTO orders (id, code, status, subtotal, tax, total, payment_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        orderId,
        code,
        OrderStatus.PENDING,
        subtotal,
        tax,
        total,
        PaymentStatus.UNPAID,
        now,
        now,
      );

      // Insert order items
      const itemStmt = db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, color, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of orderItems) {
        const itemId = generateOrderItemId();
        itemStmt.run(
          itemId,
          orderId,
          item.product.id,
          item.product.sku,
          item.product.name,
          item.quantity,
          item.product.price,
          item.color || null,
          now,
        );
      }

      return this.getOrderById(orderId)!;
    } catch (error) {
      throw new ValidationError('Failed to create order', error);
    }
  }

  getOrderById(id: string): Order | null {
    const row = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(id) as any;

    if (!row) {
      return null;
    }

    const items = (db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(id) as any[]).map((itemRow) => this.mapRowToOrderItem(itemRow));

    return this.mapRowToOrder(row, items);
  }

  getOrderByCode(code: string): Order | null {
    const row = db
      .prepare('SELECT * FROM orders WHERE code = ?')
      .get(code) as any;

    if (!row) {
      return null;
    }

    const items = (db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(row.id) as any[]).map((itemRow) => this.mapRowToOrderItem(itemRow));

    return this.mapRowToOrder(row, items);
  }

  listOrders(
    limit: number = 20,
    offset: number = 0,
    status?: OrderStatus,
    startDate?: string,
    endDate?: string,
  ): { orders: Order[]; total: number } {
    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    const conditions: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params) as any[];

    const orders = rows.map((row) => {
      const items = (db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(row.id) as any[]).map((itemRow) => this.mapRowToOrderItem(itemRow));

      return this.mapRowToOrder(row, items);
    });

    let countQuery = 'SELECT COUNT(*) as count FROM orders';
    const countParams: any[] = [];

    if (conditions.length > 0) {
      // Reconstruct conditions for count query
      const countConditions: string[] = [];

      if (status) {
        countConditions.push('status = ?');
        countParams.push(status);
      }

      if (startDate) {
        countConditions.push('created_at >= ?');
        countParams.push(startDate);
      }

      if (endDate) {
        countConditions.push('created_at <= ?');
        countParams.push(endDate);
      }

      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const total = (db.prepare(countQuery).get(...countParams) as any).count;

    return { orders, total };
  }

  updateOrderStatus(id: string, input: UpdateOrderStatusInput): Order {
    const order = this.getOrderById(id);
    if (!order) {
      throw new NotFoundError(`Order with id ${id} not found`);
    }

    const now = new Date().toISOString();
    const completedAt = input.status === OrderStatus.COMPLETED ? now : null;

    const stmt = db.prepare(`
      UPDATE orders SET
        status = ?,
        notes = COALESCE(?, notes),
        completed_at = COALESCE(?, completed_at),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(input.status, input.notes || null, completedAt, now, id);

    return this.getOrderById(id)!;
  }

  updateOrderPayment(
    id: string,
    paymentMethod: string,
    paymentStatus: PaymentStatus,
  ): Order {
    const order = this.getOrderById(id);
    if (!order) {
      throw new NotFoundError(`Order with id ${id} not found`);
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE orders SET
        payment_method = ?,
        payment_status = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(paymentMethod, paymentStatus, now, id);

    return this.getOrderById(id)!;
  }

  completeOrder(id: string, paymentMethod: string, notes?: string): Order {
    const order = this.getOrderById(id);
    if (!order) {
      throw new NotFoundError(`Order with id ${id} not found`);
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE orders SET
        status = ?,
        payment_method = ?,
        payment_status = ?,
        notes = COALESCE(?, notes),
        completed_at = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      OrderStatus.COMPLETED,
      paymentMethod,
      PaymentStatus.PAID,
      notes || null,
      now,
      now,
      id,
    );

    return this.getOrderById(id)!;
  }

  getOrderStats(): {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  } {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'COMPLETED' THEN total ELSE 0 END) as total_revenue
      FROM orders
    `).get() as any;

    const avgRow = db.prepare(`
      SELECT AVG(total) as avg_total FROM orders WHERE status = 'COMPLETED'
    `).get() as any;

    return {
      totalOrders: stats.total_orders || 0,
      completedOrders: stats.completed_orders || 0,
      pendingOrders: stats.pending_orders || 0,
      totalRevenue: stats.total_revenue || 0,
      averageOrderValue: avgRow.avg_total || 0,
    };
  }

  getTopProducts(limit: number = 10): any[] {
    return (db
      .prepare(`
        SELECT
          oi.sku,
          oi.name,
          SUM(oi.quantity) as total_quantity,
          COUNT(DISTINCT oi.order_id) as order_count,
          SUM(oi.quantity * oi.unit_price) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'COMPLETED'
        GROUP BY oi.sku
        ORDER BY total_quantity DESC
        LIMIT ?
      `)
      .all(limit) as any[]);
  }

  private mapRowToOrder(row: any, items: OrderItem[]): Order {
    return {
      id: row.id,
      code: row.code,
      status: row.status as OrderStatus,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      paymentMethod: row.payment_method || undefined,
      paymentStatus: row.payment_status as PaymentStatus,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at || undefined,
      notes: row.notes || undefined,
    };
  }

  private mapRowToOrderItem(row: any): OrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      sku: row.sku,
      name: row.name,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      color: row.color || undefined,
      createdAt: row.created_at,
    };
  }
}

export const orderService = new OrderService();
