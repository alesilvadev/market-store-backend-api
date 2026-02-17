import { z } from 'zod';
import { UserRole, OrderStatus, PaymentMethod, PaymentStatus } from '../types/index.js';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().max(100).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CASHIER),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateUserSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').toLowerCase().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Product schemas
export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  color: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Order schemas
export const orderItemSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  color: z.string().optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const completeOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentStatus: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.PAID),
  notes: z.string().max(500).optional(),
});

export type CompleteOrderInput = z.infer<typeof completeOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(500).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// CSV Import schema
export const csvImportSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  color: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type CSVImportInput = z.infer<typeof csvImportSchema>;

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Filter schemas
export const orderFilterSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
