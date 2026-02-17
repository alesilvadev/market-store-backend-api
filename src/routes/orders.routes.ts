import { Hono } from 'hono';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  completeOrderSchema,
  orderFilterSchema,
} from '../schemas/index.js';
import { orderService } from '../services/order.service.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, getAuthContext } from '../middleware/auth.js';

const router = new Hono();

// Create order (public endpoint)
router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>,
        400,
      );
    }

    const order = orderService.createOrder(result.data);

    logger.info('Order created', { orderId: order.id, code: order.code });

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(
        {
          success: false,
          error: { message: error.message, details: error.details },
        } as ApiResponse<null>,
        error.statusCode,
      );
    }

    logger.error('Create order error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Get order by code (public endpoint for customer verification)
router.get('/code/:code', async (c) => {
  try {
    const code = c.req.param('code');

    const order = orderService.getOrderByCode(code);

    if (!order) {
      return c.json(
        {
          success: false,
          error: { message: 'Order not found' },
        } as ApiResponse<null>,
        404,
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Get order by code error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Get order by ID (authenticated)
router.get('/:id', authenticate, async (c) => {
  try {
    const id = c.req.param('id');

    const order = orderService.getOrderById(id);

    if (!order) {
      return c.json(
        {
          success: false,
          error: { message: 'Order not found' },
        } as ApiResponse<null>,
        404,
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Get order error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// List orders (authenticated)
router.get('/', authenticate, async (c) => {
  try {
    const query = c.req.query();
    const result = orderFilterSchema.safeParse(query);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>,
        400,
      );
    }

    const { page, limit, status, startDate, endDate } = result.data;
    const offset = (page - 1) * limit;

    const { orders, total } = orderService.listOrders(limit, offset, status, startDate, endDate);

    const response: ApiResponse<any> = {
      success: true,
      data: orders,
      meta: {
        page,
        limit,
        total,
      },
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('List orders error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Complete order (authenticated - cashier)
router.post('/:id/complete', authenticate, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = completeOrderSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>,
        400,
      );
    }

    const auth = getAuthContext(c);
    const { paymentMethod, notes } = result.data;

    const order = orderService.completeOrder(id, paymentMethod, notes);

    logger.info('Order completed', {
      orderId: id,
      code: order.code,
      paymentMethod,
      completedBy: auth.user.id,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(
        {
          success: false,
          error: { message: error.message, details: error.details },
        } as ApiResponse<null>,
        error.statusCode,
      );
    }

    logger.error('Complete order error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Update order status (authenticated - admin)
router.patch('/:id/status', authenticate, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateOrderStatusSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>,
        400,
      );
    }

    const order = orderService.updateOrderStatus(id, result.data);

    logger.info('Order status updated', { orderId: id, status: result.data.status });

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return c.json(response, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(
        {
          success: false,
          error: { message: error.message },
        } as ApiResponse<null>,
        error.statusCode,
      );
    }

    logger.error('Update order status error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

export { router as ordersRouter };
