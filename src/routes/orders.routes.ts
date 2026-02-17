import { Router, Request, Response, NextFunction } from 'express';
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

export const ordersRouter = Router();

ordersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = createOrderSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: result.error.flatten(),
        },
      } as ApiResponse<null>);
    }

    const order = orderService.createOrder(result.data);

    logger.info('Order created', { orderId: order.id, code: order.code });

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code;

    const order = orderService.getOrderByCode(code);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      } as ApiResponse<null>);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    const order = orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' },
      } as ApiResponse<null>);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: order,
    };

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = orderFilterSchema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: result.error.flatten(),
        },
      } as ApiResponse<null>);
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

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

ordersRouter.post(
  '/:id/complete',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = completeOrderSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const auth = getAuthContext(req);
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

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

ordersRouter.patch(
  '/:id/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = updateOrderStatusSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const order = orderService.updateOrderStatus(id, result.data);

      logger.info('Order status updated', { orderId: id, status: result.data.status });

      const response: ApiResponse<any> = {
        success: true,
        data: order,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
