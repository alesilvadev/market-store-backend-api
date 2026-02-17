import { Context } from 'hono';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ApiResponse } from '../types/index.js';

export function errorHandler(err: Error, c: Context) {
  logger.error('Request error', err, {
    path: c.req.path,
    method: c.req.method,
  });

  if (err instanceof ApiError) {
    const errorObj: any = {
      message: err.message,
    };
    if (err.details) {
      errorObj.details = err.details;
    }
    const response: ApiResponse<null> = {
      success: false,
      error: errorObj,
    };

    return c.json(response, err.statusCode);
  }

  const response: ApiResponse<null> = {
    success: false,
    error: {
      message: 'Internal server error',
    },
  };

  return c.json(response, 500);
}

export function handleValidationError(errors: any) {
  return {
    success: false,
    error: {
      message: 'Validation error',
      details: errors,
    },
  };
}
