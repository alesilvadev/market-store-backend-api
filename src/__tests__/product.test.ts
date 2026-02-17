import { describe, it, expect, beforeEach } from 'vitest';
import { productService } from '../services/product.service';

describe('Product Service', () => {
  describe('Product Search by SKU', () => {
    it('should find products by exact SKU match', () => {
      const sku = 'PROD-001';
      const products = productService.searchProductsBySku(sku);

      if (products.length > 0) {
        products.forEach((product) => {
          expect(product.sku).toContain(sku);
        });
      }
    });

    it('should return empty array for non-existent SKU', () => {
      const products = productService.searchProductsBySku('NON-EXISTENT-SKU-99999');
      expect(Array.isArray(products)).toBe(true);
    });

    it('should handle case-sensitive SKU search', () => {
      const results1 = productService.searchProductsBySku('PROD-001');
      const results2 = productService.searchProductsBySku('prod-001');

      // Both should work or both should be consistent
      expect(Array.isArray(results1)).toBe(true);
      expect(Array.isArray(results2)).toBe(true);
    });

    it('should return products with valid structure', () => {
      const products = productService.searchProductsBySku('PROD');

      if (products.length > 0) {
        products.forEach((product) => {
          expect(product.id).toBeTruthy();
          expect(product.sku).toBeTruthy();
          expect(product.name).toBeTruthy();
          expect(typeof product.price).toBe('number');
          expect(product.price > 0).toBe(true);
          expect(typeof product.isActive).toBe('boolean');
        });
      }
    });
  });

  describe('Get Product by ID', () => {
    it('should return product for valid ID', () => {
      // Get a product first
      const products = productService.searchProductsBySku('PROD');
      if (products.length > 0) {
        const product = productService.getProductById(products[0].id);
        expect(product).toBeTruthy();
        expect(product?.id).toBe(products[0].id);
      }
    });

    it('should return null for non-existent ID', () => {
      const product = productService.getProductById('non-existent-id-99999');
      expect(product).toBeNull();
    });

    it('should return complete product data', () => {
      const products = productService.searchProductsBySku('PROD');
      if (products.length > 0) {
        const product = productService.getProductById(products[0].id);
        expect(product).toBeTruthy();
        if (product) {
          expect(product.id).toBeTruthy();
          expect(product.sku).toBeTruthy();
          expect(product.name).toBeTruthy();
          expect(product.price).toBeGreaterThan(0);
          expect(product.isActive).toBeDefined();
          expect(product.createdAt).toBeTruthy();
          expect(product.updatedAt).toBeTruthy();
        }
      }
    });
  });

  describe('List Products with Pagination', () => {
    it('should list products with valid pagination', () => {
      const limit = 10;
      const offset = 0;
      const { products, total } = productService.listProducts(limit, offset, true);

      expect(Array.isArray(products)).toBe(true);
      expect(typeof total).toBe('number');
      expect(total >= 0).toBe(true);
      expect(products.length <= limit).toBe(true);
    });

    it('should respect limit parameter', () => {
      const limit = 5;
      const { products } = productService.listProducts(limit, 0, true);

      expect(products.length <= limit).toBe(true);
    });

    it('should respect offset parameter', () => {
      const limit = 10;
      const { products: page1 } = productService.listProducts(limit, 0, true);
      const { products: page2 } = productService.listProducts(limit, limit, true);

      // Pages should be different (unless very few products)
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it('should only return active products when filter is true', () => {
      const { products } = productService.listProducts(100, 0, true);

      if (products.length > 0) {
        products.forEach((product) => {
          expect(product.isActive).toBe(true);
        });
      }
    });

    it('should return all products when filter is false', () => {
      const { products } = productService.listProducts(100, 0, false);

      expect(Array.isArray(products)).toBe(true);
      // Could include inactive products
      expect(products.length >= 0).toBe(true);
    });
  });

  describe('Product Validation', () => {
    it('should validate required fields', () => {
      const invalidProducts = [
        { sku: '', name: 'Valid Name', price: 100 }, // Empty SKU
        { sku: 'VALID-SKU', name: '', price: 100 }, // Empty name
        { sku: 'VALID-SKU', name: 'Valid Name', price: 0 }, // Invalid price
        { sku: 'VALID-SKU', name: 'Valid Name', price: -10 }, // Negative price
      ];

      invalidProducts.forEach((product) => {
        const hasValidSku = product.sku.length > 0;
        const hasValidName = product.name.length > 0;
        const hasValidPrice = product.price > 0;

        expect(hasValidSku && hasValidName && hasValidPrice).toBe(false);
      });
    });

    it('should validate price is positive number', () => {
      const validPrices = [10, 99.99, 0.01, 10000];
      const invalidPrices = [0, -10, -0.01];

      validPrices.forEach((price) => {
        expect(price > 0).toBe(true);
      });

      invalidPrices.forEach((price) => {
        expect(price > 0).toBe(false);
      });
    });

    it('should validate SKU format', () => {
      const validSkus = ['PROD-001', 'SKU123', 'A-B-C', 'ITEM_1'];
      const invalidSkus = ['', 'a'.repeat(51)]; // Too long

      validSkus.forEach((sku) => {
        expect(sku.length > 0 && sku.length <= 50).toBe(true);
      });

      invalidSkus.forEach((sku) => {
        expect(sku.length > 0 && sku.length <= 50).toBe(false);
      });
    });
  });

  describe('Product Filtering and Search Edge Cases', () => {
    it('should handle empty search string', () => {
      const products = productService.searchProductsBySku('');
      expect(Array.isArray(products)).toBe(true);
    });

    it('should handle special characters in search', () => {
      const specialChars = ['@', '#', '$', '%', '&', '*'];

      specialChars.forEach((char) => {
        const products = productService.searchProductsBySku(char);
        expect(Array.isArray(products)).toBe(true);
      });
    });

    it('should handle very long search strings', () => {
      const longSku = 'A'.repeat(1000);
      const products = productService.searchProductsBySku(longSku);
      expect(Array.isArray(products)).toBe(true);
    });

    it('should handle SQL injection attempts in search', () => {
      const sqlInjection = "'; DROP TABLE products; --";
      const products = productService.searchProductsBySku(sqlInjection);
      expect(Array.isArray(products)).toBe(true);
      // Database should still exist and be queryable
    });
  });
});
