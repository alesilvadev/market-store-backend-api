import { randomBytes } from 'crypto';

export function generateId(): string {
  return randomBytes(16).toString('hex');
}

export function generateOrderCode(): string {
  // Generate a 6-8 character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 8;
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

export function generateProductId(): string {
  return `PRD_${generateId()}`;
}

export function generateUserId(): string {
  return `USR_${generateId()}`;
}

export function generateOrderId(): string {
  return `ORD_${generateId()}`;
}

export function generateOrderItemId(): string {
  return `OIT_${generateId()}`;
}

export function generateCartItemId(): string {
  return `CIT_${generateId()}`;
}

export function generateImportId(): string {
  return `IMP_${generateId()}`;
}

export function generateAuditLogId(): string {
  return `AUD_${generateId()}`;
}
