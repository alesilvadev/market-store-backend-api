import { db } from '../db/init.js';
import { Product } from '../types/index.js';
import { generateProductId } from '../utils/id.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { CreateProductInput, UpdateProductInput } from '../schemas/index.js';

export class ProductService {
  createProduct(input: CreateProductInput): Product {
    // Check if SKU already exists
    const existing = db
      .prepare('SELECT id FROM products WHERE sku = ?')
      .get(input.sku);

    if (existing) {
      throw new ConflictError(`Product with SKU ${input.sku} already exists`);
    }

    const id = generateProductId();
    const now = new Date().toISOString();

    try {
      const stmt = db.prepare(`
        INSERT INTO products (id, sku, name, description, price, color, image_url, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        input.sku,
        input.name,
        input.description || null,
        input.price,
        input.color || null,
        input.imageUrl || null,
        input.isActive ? 1 : 0,
        now,
        now,
      );

      return this.getProductById(id)!;
    } catch (error) {
      throw new ValidationError('Failed to create product', error);
    }
  }

  getProductById(id: string): Product | null {
    const row = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(id) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToProduct(row);
  }

  getProductBySku(sku: string): Product | null {
    const row = db
      .prepare('SELECT * FROM products WHERE sku = ?')
      .get(sku) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToProduct(row);
  }

  listProducts(limit: number = 20, offset: number = 0, activeOnly: boolean = true) {
    let query = 'SELECT * FROM products';
    const params: any[] = [];

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = (db.prepare(query).all(...params) as any[]).map((row) =>
      this.mapRowToProduct(row),
    );

    let countQuery = 'SELECT COUNT(*) as count FROM products';
    if (activeOnly) {
      countQuery += ' WHERE is_active = 1';
    }

    const total = (db.prepare(countQuery).get() as any).count;

    return { products, total };
  }

  searchProductsBySku(sku: string): Product[] {
    const products = (db
      .prepare('SELECT * FROM products WHERE sku LIKE ? AND is_active = 1')
      .all(`%${sku}%`) as any[]).map((row) => this.mapRowToProduct(row));

    return products;
  }

  updateProduct(id: string, input: UpdateProductInput): Product {
    const product = this.getProductById(id);
    if (!product) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    // Check if new SKU is already in use
    if (input.sku && input.sku !== product.sku) {
      const existing = db
        .prepare('SELECT id FROM products WHERE sku = ? AND id != ?')
        .get(input.sku, id);

      if (existing) {
        throw new ConflictError(`Product with SKU ${input.sku} already exists`);
      }
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE products SET
        sku = COALESCE(?, sku),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        color = COALESCE(?, color),
        image_url = COALESCE(?, image_url),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      input.sku || null,
      input.name || null,
      input.description !== undefined ? input.description : null,
      input.price !== undefined ? input.price : null,
      input.color !== undefined ? input.color : null,
      input.imageUrl !== undefined ? input.imageUrl : null,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : null,
      now,
      id,
    );

    return this.getProductById(id)!;
  }

  deleteProduct(id: string): void {
    const product = this.getProductById(id);
    if (!product) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description || undefined,
      price: parseFloat(row.price),
      color: row.color || undefined,
      imageUrl: row.image_url || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const productService = new ProductService();
