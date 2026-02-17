import { Context, Next } from 'hono';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt.js';
import { userService } from '../services/user.service.js';
import { AuthContext } from '../types/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

declare global {
  namespace HonoRequest {
    interface HonoRequest {
      auth?: AuthContext;
    }
  }
}

export async function authenticate(c: Context, next: Next) {
  const token = extractTokenFromHeader(c.req.header('Authorization'));

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

  (c as any).auth = {
    user,
    token,
  };

  await next();
}

export function authorize(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const auth = (c as any).auth;

    if (!auth) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(auth.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    await next();
  };
}

export function getAuthContext(c: Context): AuthContext {
  const auth = (c as any).auth;

  if (!auth) {
    throw new AuthenticationError('Not authenticated');
  }

  return auth;
}
