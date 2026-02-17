import { Router, Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { createProductSchema, updateProductSchema, paginationSchema } from '../schemas/index.js';
import { ApiError } from '../utils/errors.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

export const productsRouter = Router();

productsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
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

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sku = req.query.sku as string;

    if (!sku) {
      return res.status(400).json({
        success: false,
        error: { message: 'SKU parameter is required' },
      } as ApiResponse<null>);
    }

    const products = productService.searchProductsBySku(sku);

    const response: ApiResponse<any> = {
      success: true,
      data: products,
    };

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const product = productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      } as ApiResponse<null>);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: product,
    };

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

productsRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = createProductSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const product = productService.createProduct(result.data);

      logger.info('Product created', { productId: product.id, sku: product.sku });

      const response: ApiResponse<any> = {
        success: true,
        data: product,
      };

      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = updateProductSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: result.error.flatten(),
          },
        } as ApiResponse<null>);
      }

      const product = productService.updateProduct(id, result.data);

      logger.info('Product updated', { productId: id });

      const response: ApiResponse<any> = {
        success: true,
        data: product,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      productService.deleteProduct(id);

      logger.info('Product deleted', { productId: id });

      const response: ApiResponse<null> = {
        success: true,
      };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
