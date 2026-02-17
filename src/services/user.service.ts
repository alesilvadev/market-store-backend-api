import { db } from '../db/init.js';
import { User, UserRole, UserWithPassword } from '../types/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateUserId } from '../utils/id.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { CreateUserInput, UpdateUserInput } from '../schemas/index.js';

export class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    const { email, password, name, role } = input;

    // Check if user already exists
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email.toLowerCase());

    if (existing) {
      throw new ConflictError(`User with email ${email} already exists`);
    }

    const id = generateUserId();
    const now = new Date().toISOString();
    const passwordHash = password ? await hashPassword(password) : null;

    try {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, email.toLowerCase(), passwordHash, name || null, role, now, now);

      return {
        id,
        email: email.toLowerCase(),
        name: name || undefined,
        role,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw new ValidationError('Failed to create user', error);
    }
  }

  getUserById(id: string): User | null {
    const row = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToUser(row);
  }

  getUserByEmail(email: string): UserWithPassword | null {
    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as any;

    if (!row) {
      return null;
    }

    return {
      ...this.mapRowToUser(row),
      passwordHash: row.password_hash,
    };
  }

  listUsers(limit: number = 20, offset: number = 0): { users: User[]; total: number } {
    const users = (db
      .prepare('SELECT * FROM users LIMIT ? OFFSET ?')
      .all(limit, offset) as any[]).map((row) => this.mapRowToUser(row));

    const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;

    return { users, total };
  }

  updateUser(id: string, input: UpdateUserInput): User {
    const user = this.getUserById(id);
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    // Check if new email is already in use
    if (input.email && input.email !== user.email) {
      const existing = db
        .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .get(input.email.toLowerCase(), id);

      if (existing) {
        throw new ConflictError(`Email ${input.email} is already in use`);
      }
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE users SET
        email = COALESCE(?, email),
        name = COALESCE(?, name),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(input.email?.toLowerCase() || null, input.name || null, now, id);

    return this.getUserById(id)!;
  }

  deleteUser(id: string): void {
    const user = this.getUserById(id);
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  async verifyUserPassword(user: UserWithPassword, password: string): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }

    return verifyPassword(password, user.passwordHash);
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = this.getUserById(userId);
    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    const passwordHash = await hashPassword(newPassword);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      passwordHash,
      now,
      userId,
    );
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name || undefined,
      role: row.role as UserRole,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const userService = new UserService();
