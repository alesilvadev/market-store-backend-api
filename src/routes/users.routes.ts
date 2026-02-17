import { Hono } from 'hono';
import { userService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema, paginationSchema } from '../schemas/index.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = new Hono();

// List users (admin only)
router.get('/', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const query = c.req.query();
    const result = paginationSchema.safeParse(query);

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

    return c.json(response, 200);
  } catch (error) {
    logger.error('List users error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const id = c.req.param('id');
    const user = userService.getUserById(id);

    if (!user) {
      return c.json(
        {
          success: false,
          error: { message: 'User not found' },
        } as ApiResponse<null>,
        404,
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: user,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Get user error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Create user (admin only)
router.post('/', authenticate, authorize(UserRole.ADMIN), async (c) => {
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

    logger.error('Create user error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateUserSchema.safeParse(body);

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

    const user = userService.updateUser(id, result.data);

    logger.info('User updated', { userId: id });

    const response: ApiResponse<any> = {
      success: true,
      data: user,
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

    logger.error('Update user error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const id = c.req.param('id');
    userService.deleteUser(id);

    logger.info('User deleted', { userId: id });

    const response: ApiResponse<null> = {
      success: true,
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

    logger.error('Delete user error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

export { router as usersRouter };
