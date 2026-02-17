import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { ApiResponse } from '../types/index.js';
import { authenticate } from '../middleware/auth.js';

export const statsRouter = Router();

statsRouter.get('/orders', authenticate, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = orderService.getOrderStats();

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

statsRouter.get(
  '/top-products',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid limit parameter' },
        } as ApiResponse<null>);
        return;
      }

      const products = orderService.getTopProducts(limit);

      const response: ApiResponse<any> = {
        success: true,
        data: products,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
