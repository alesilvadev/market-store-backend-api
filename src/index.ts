import express from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import { initializeDatabase, closeDatabase } from './db/init.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { importRouter } from './routes/import.routes.js';
import { statsRouter } from './routes/stats.routes.js';
import { errorHandlerMiddleware } from './middleware/error.js';
import { logger } from './utils/logger.js';

const app = express();

try {
  initializeDatabase();
  logger.info('Database initialized successfully');
} catch (error) {
  logger.error('Failed to initialize database', error);
  process.exit(1);
}

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3002').split(',');

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req: express.Request, res: express.Response): void => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/import', importRouter);
app.use('/api/stats', statsRouter);

app.use((_req: express.Request, res: express.Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
    },
  });
});

app.use(errorHandlerMiddleware);

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

export const api = onRequest(app);

const PORT = parseInt(process.env.PORT || '3000', 10);
logger.info(`Market Store API ready on port ${PORT}`);
