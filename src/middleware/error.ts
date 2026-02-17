import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ApiResponse } from '../types/index.js';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
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

    return res.status(err.statusCode).json(response);
  }

  const response: ApiResponse<null> = {
    success: false,
    error: {
      message: 'Internal server error',
    },
  };

  return res.status(500).json(response);
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
