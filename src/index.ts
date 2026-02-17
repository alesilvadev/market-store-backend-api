import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initializeDatabase, closeDatabase } from './db/init.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { importRouter } from './routes/import.routes.js';
import { statsRouter } from './routes/stats.routes.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './utils/logger.js';
import { ApiResponse } from './types/index.js';

const app = new Hono();

// Initialize database
try {
  initializeDatabase();
  logger.info('Database initialized successfully');
} catch (error) {
  logger.error('Failed to initialize database', error);
  process.exit(1);
}

// CORS configuration
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3002').split(
  ',',
);

app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Health check endpoint
app.get('/api/health', (c) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };

  return c.json(response, 200);
});

// API Routes
app.route('/api/auth', authRouter);
app.route('/api/products', productsRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/users', usersRouter);
app.route('/api/import', importRouter);
app.route('/api/stats', statsRouter);

// 404 handler
app.notFound((c) => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      message: 'Endpoint not found',
    },
  };

  return c.json(response, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error('Unhandled error', err);
  return errorHandler(err, c);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

const PORT = parseInt(process.env.PORT || '3000', 10);

// Start server
export default {
  port: PORT,
  fetch: app.fetch,
};

logger.info(`Market Store API starting on port ${PORT}`);
