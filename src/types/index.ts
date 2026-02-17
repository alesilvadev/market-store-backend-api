// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash?: string;
}

// Product types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  color?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order types
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  OTHER = 'OTHER',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  color?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  color?: string;
  listType: 'COMPRAR' | 'DESEADOS';
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// API Request/Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Context type for authenticated requests
export interface AuthContext {
  user: User;
  token: string;
}
