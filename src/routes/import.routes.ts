import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { productService } from '../services/product.service.js';
import { csvImportSchema } from '../schemas/index.js';
import { generateImportId } from '../utils/id.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize, getAuthContext } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import { db } from '../db/init.js';

export const importRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

importRouter.post(
  '/csv',
  authenticate,
  authorize(UserRole.ADMIN),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: 'File is required' },
        } as ApiResponse<null>);
        return;
      }

      const text = req.file.buffer.toString('utf-8');
      const auth = getAuthContext(req);

      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const results: any[] = [];
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const validation = csvImportSchema.safeParse({
          sku: row.sku,
          name: row.name,
          description: row.description,
          price: row.price,
          color: row.color,
          imageUrl: row.image_url,
        });

        if (!validation.success) {
          failedCount++;
          errors.push(`Row ${i + 1}: ${JSON.stringify(validation.error.flatten())}`);
          continue;
        }

        const productData = {
          ...validation.data,
          isActive: true,
        };

        try {
          const existing = productService.getProductBySku(productData.sku);

          if (existing) {
            productService.updateProduct(existing.id, productData);
          } else {
            productService.createProduct(productData);
          }

          successCount++;
          results.push(productData);
        } catch (error) {
          failedCount++;
          errors.push(`Row ${i + 1}: ${(error as Error).message}`);
        }
      }

      const importId = generateImportId();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO csv_imports (id, user_id, filename, total_rows, successful_rows, failed_rows, errors, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        importId,
        auth.user.id,
        req.file.originalname,
        lines.length - 1,
        successCount,
        failedCount,
        JSON.stringify(errors),
        now
      );

      logger.info('CSV import completed', {
        importId,
        filename: req.file.originalname,
        successful: successCount,
        failed: failedCount,
        userId: auth.user.id,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: {
          importId,
          filename: req.file.originalname,
          totalRows: lines.length - 1,
          successfulRows: successCount,
          failedRows: failedCount,
          errors: errors.slice(0, 10),
          importedProducts: results,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
