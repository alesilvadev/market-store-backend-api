import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema, paginationSchema } from '../schemas/index.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize, getAuthContext } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

export const usersRouter = Router();

usersRouter.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = paginationSchema.safeParse(req.query);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
        return;
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

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const user = userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' },
        } as ApiResponse<null>);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = createUserSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
        return;
      }

      const auth = getAuthContext(req);
      const user = await userService.createUser(result.data);

      logger.info('User created', { userId: user.id, email: user.email, createdBy: auth.user.id });

      const response: ApiResponse<any> = {
        success: true,
        data: user,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const result = updateUserSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
        return;
      }

      const user = userService.updateUser(id, result.data);

      logger.info('User updated', { userId: id });

      const response: ApiResponse<any> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      userService.deleteUser(id);

      logger.info('User deleted', { userId: id });

      const response: ApiResponse<null> = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
