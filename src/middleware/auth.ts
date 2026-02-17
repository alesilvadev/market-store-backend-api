import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt.js';
import { userService } from '../services/user.service.js';
import { AuthContext } from '../types/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const payload = verifyToken(token);

    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }

    const user = userService.getUserById(payload.userId);

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.auth = {
      user,
      token,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.auth) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.auth.user.role)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function getAuthContext(req: Request): AuthContext {
  if (!req.auth) {
    throw new AuthenticationError('Not authenticated');
  }

  return req.auth;
}
