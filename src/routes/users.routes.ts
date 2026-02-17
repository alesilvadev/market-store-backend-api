import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema, paginationSchema } from '../schemas/index.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

export const usersRouter = Router();

usersRouter.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = paginationSchema.safeParse(req.query);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const { page, limit } = result.data;
      const offset = (page - 1) * limit;

      const { users, total } = userService.listUsers(limit, offset);

      const response: ApiResponse<any> = {
        success: true,
        data: users,
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
  }
);

usersRouter.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const user = userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' },
        } as ApiResponse<null>);
      }

      const response: ApiResponse<any> = {
        success: true,
        data: user,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = createUserSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const auth = authenticate as any;
      const user = userService.createUser(result.data, auth?.user?.id);

      logger.info('User created', { userId: user.id, email: user.email });

      const response: ApiResponse<any> = {
        success: true,
        data: user,
      };

      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = updateUserSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const user = userService.updateUser(id, result.data);

      logger.info('User updated', { userId: id });

      const response: ApiResponse<any> = {
        success: true,
        data: user,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      userService.deleteUser(id);

      logger.info('User deleted', { userId: id });

      const response: ApiResponse<null> = {
        success: true,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
