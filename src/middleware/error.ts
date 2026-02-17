import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ApiResponse } from '../types/index.js';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Request error', err, {
    path: req.path,
    method: req.method,
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

    res.status(err.statusCode).json(response);
    return;
  }

  const response: ApiResponse<null> = {
    success: false,
    error: {
      message: 'Internal server error',
    },
  };

  res.status(500).json(response);
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
