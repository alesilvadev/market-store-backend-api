import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';

export const statsRouter = Router();

statsRouter.get('/orders', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = orderService.getOrderStats();

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
    };

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

statsRouter.get(
  '/top-products',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid limit parameter' },
        } as ApiResponse<null>);
      }

      const products = orderService.getTopProducts(limit);

      const response: ApiResponse<any> = {
        success: true,
        data: products,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
