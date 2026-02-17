import { Router, Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { createProductSchema, updateProductSchema, paginationSchema } from '../schemas/index.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

export const productsRouter = Router();

productsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    res.json(response);
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/search', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sku = req.query.sku as string;

    if (!sku) {
      res.status(400).json({
        success: false,
        error: { message: 'SKU parameter is required' },
      } as ApiResponse<null>);
      return;
    }

    const products = productService.searchProductsBySku(sku);

    const response: ApiResponse<any> = {
      success: true,
      data: products,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    const product = productService.getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not found' },
      } as ApiResponse<null>);
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: product,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

productsRouter.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = createProductSchema.safeParse(req.body);

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

      const product = productService.createProduct(result.data);

      logger.info('Product created', { productId: product.id, sku: product.sku });

      const response: ApiResponse<any> = {
        success: true,
        data: product,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const result = updateProductSchema.safeParse(req.body);

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

      const product = productService.updateProduct(id, result.data);

      logger.info('Product updated', { productId: id });

      const response: ApiResponse<any> = {
        success: true,
        data: product,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      productService.deleteProduct(id);

      logger.info('Product deleted', { productId: id });

      const response: ApiResponse<null> = {
        success: true,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
