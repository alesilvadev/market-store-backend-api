import { Hono } from 'hono';
import { productService } from '../services/product.service.js';
import { csvImportSchema } from '../schemas/index.js';
import { generateImportId } from '../utils/id.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { authenticate, authorize, getAuthContext } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';
import { db } from '../db/init.js';

const router = new Hono();

// CSV Import endpoint (admin only)
router.post('/csv', authenticate, authorize(UserRole.ADMIN), async (c) => {
  try {
    const data = await c.req.formData();
    const file = data.get('file') as File;

    if (!file) {
      return c.json(
        {
          success: false,
          error: { message: 'File is required' },
        } as ApiResponse<null>,
        400,
      );
    }

    const text = await file.text();
    const auth = getAuthContext(c);

    // Parse CSV
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

      // Validate row
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

      // Parse data and add defaults
      const productData = {
        ...validation.data,
        isActive: true,
      };

      try {
        // Check if product already exists
        const existing = productService.getProductBySku(productData.sku);

        if (existing) {
          // Update existing product
          productService.updateProduct(existing.id, productData);
        } else {
          // Create new product
          productService.createProduct(productData);
        }

        successCount++;
        results.push(productData);
      } catch (error) {
        failedCount++;
        errors.push(`Row ${i + 1}: ${(error as Error).message}`);
      }
    }

    // Log import
    const importId = generateImportId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO csv_imports (id, user_id, filename, total_rows, successful_rows, failed_rows, errors, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      importId,
      auth.user.id,
      file.name,
      lines.length - 1,
      successCount,
      failedCount,
      JSON.stringify(errors),
      now,
    );

    logger.info('CSV import completed', {
      importId,
      filename: file.name,
      successful: successCount,
      failed: failedCount,
      userId: auth.user.id,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        importId,
        filename: file.name,
        totalRows: lines.length - 1,
        successfulRows: successCount,
        failedRows: failedCount,
        errors: errors.slice(0, 10), // Return first 10 errors
        importedProducts: results,
      },
    };

    return c.json(response, 200);
  } catch (error) {
    logger.error('CSV import error', error);
    return c.json(
      {
        success: false,
        error: { message: 'CSV import failed', details: (error as Error).message },
      } as ApiResponse<null>,
      500,
    );
  }
});

export { router as importRouter };
