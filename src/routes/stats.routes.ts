import { Hono } from 'hono';
import { orderService } from '../services/order.service.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';

const router = new Hono();

// Get order statistics (authenticated)
router.get('/orders', authenticate, async (c) => {
  try {
    const stats = orderService.getOrderStats();

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Get order stats error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Get top products (authenticated)
router.get('/top-products', authenticate, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return c.json(
        {
          success: false,
          error: { message: 'Invalid limit parameter' },
        } as ApiResponse<null>,
        400,
      );
    }

    const products = orderService.getTopProducts(limit);

    const response: ApiResponse<any> = {
      success: true,
      data: products,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Get top products error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

export { router as statsRouter };
