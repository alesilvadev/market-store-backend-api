import { Hono } from 'hono';
import { productService } from '../services/product.service.js';
import { createProductSchema, updateProductSchema, paginationSchema } from '../schemas/index.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = new Hono();

// Get all products (public endpoint)
router.get('/', async (c) => {
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

    const { products, total } = productService.listProducts(limit, offset, true);

    const response: ApiResponse<any> = {
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
      },
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('List products error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Search products by SKU (public endpoint)
router.get('/search', async (c) => {
  try {
    const sku = c.req.query('sku');

    if (!sku) {
      return c.json(
        {
          success: false,
          error: { message: 'SKU parameter is required' },
        } as ApiResponse<null>,
        400,
      );
    }

    const products = productService.searchProductsBySku(sku);

    const response: ApiResponse<any> = {
      success: true,
      data: products,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Search products error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Get product by ID
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = productService.getProductById(id);

    if (!product) {
      return c.json(
        {
          success: false,
          error: { message: 'Product not found' },
        } as ApiResponse<null>,
        404,
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: product,
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('Get product error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Create product (admin only)
router.post('/', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const body = await c.req.json();
    const result = createProductSchema.safeParse(body);

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

    const product = productService.createProduct(result.data);

    logger.info('Product created', { productId: product.id, sku: product.sku });

    const response: ApiResponse<any> = {
      success: true,
      data: product,
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

    logger.error('Create product error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Update product (admin only)
router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateProductSchema.safeParse(body);

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

    const product = productService.updateProduct(id, result.data);

    logger.info('Product updated', { productId: id });

    const response: ApiResponse<any> = {
      success: true,
      data: product,
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

    logger.error('Update product error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const id = c.req.param('id');
    productService.deleteProduct(id);

    logger.info('Product deleted', { productId: id });

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

    logger.error('Delete product error', error);
    return c.json(
      {
        success: false,
        error: { message: 'Internal server error' },
      } as ApiResponse<null>,
      500,
    );
  }
});

export { router as productsRouter };
