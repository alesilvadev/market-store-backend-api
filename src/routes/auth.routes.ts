import { Router, Request, Response, NextFunction } from 'express';
import { loginSchema, createUserSchema } from '../schemas/index.js';
import { userService } from '../services/user.service.js';
import { generateToken } from '../utils/jwt.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize, getAuthContext } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: result.error.flatten(),
        },
      } as ApiResponse<null>);
    }

    const { email, password } = result.data;

    const user = userService.getUserByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid email or password' },
      } as ApiResponse<null>);
    }

    const isPasswordValid = await userService.verifyUserPassword(user, password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid email or password' },
      } as ApiResponse<null>);
    }

    const token = generateToken(user);

    logger.info('User logged in', { userId: user.id, email: user.email });

    return res.json({
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

      const auth = getAuthContext(req);
      const user = userService.createUser(result.data, auth.user.id);

      logger.info('User created', { userId: user.id, email: user.email, createdBy: auth.user.id });

      return res.status(201).json({
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

authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  const auth = getAuthContext(req);

  return res.json({
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
