import { Hono } from 'hono';
import { loginSchema, createUserSchema } from '../schemas/index.js';
import { userService } from '../services/user.service.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, getAuthContext } from '../middleware/auth.js';

const router = new Hono();

// Login endpoint
router.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const result = loginSchema.safeParse(body);

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

    const { email, password } = result.data;

    const user = userService.getUserByEmail(email);

    if (!user || !user.passwordHash) {
      return c.json(
        {
          success: false,
          error: { message: 'Invalid email or password' },
        } as ApiResponse<null>,
        400,
      );
    }

    const isPasswordValid = await userService.verifyUserPassword(user, password);

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          error: { message: 'Invalid email or password' },
        } as ApiResponse<null>,
        400,
      );
    }

    const token = generateToken(user);

    logger.info('User login successful', { userId: user.id, email: user.email });

    const response: ApiResponse<{ user: any; token: string }> = {
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

    logger.error('Login error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Register endpoint (admin only)
router.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const result = createUserSchema.safeParse(body);

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

    const user = await userService.createUser(result.data);

    logger.info('User created', { userId: user.id, email: user.email });

    const response: ApiResponse<any> = {
      success: true,
      data: user,
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

    logger.error('Register error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Get current user
router.get('/me', authenticate, async (c) => {
  try {
    const auth = getAuthContext(c);

    const response: ApiResponse<any> = {
      success: true,
      data: auth.user,
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

    logger.error('Get current user error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

export { router as authRouter };
