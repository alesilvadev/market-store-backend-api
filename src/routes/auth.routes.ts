import { Router, Request, Response, NextFunction } from 'express';
import { loginSchema, createUserSchema } from '../schemas/index.js';
import { userService } from '../services/user.service.js';
import { generateToken } from '../utils/jwt.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize, getAuthContext } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);

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

    const { email, password } = result.data;

    const user = userService.getUserByEmail(email);

    if (!user || !user.passwordHash) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid email or password' },
      } as ApiResponse<null>);
      return;
    }

    const isPasswordValid = await userService.verifyUserPassword(user, password);

    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid email or password' },
      } as ApiResponse<null>);
      return;
    }

    const token = generateToken(user);

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    } as ApiResponse<any>);
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
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

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      } as ApiResponse<any>);
    } catch (error) {
      next(error);
    }
  }
);

authRouter.get('/me', authenticate, (req: Request, res: Response): void => {
  const auth = getAuthContext(req);

  res.json({
    success: true,
    data: {
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        role: auth.user.role,
      },
    },
  } as ApiResponse<any>);
});
