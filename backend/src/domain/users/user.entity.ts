import { UserRole } from './role.enum.js';

export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    username: string,
    passwordHash: string,
    role: UserRole
  ): User {
    const now = new Date();
    return new User(id, username, passwordHash, role, now, now);
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isNikita(): boolean {
    return this.role === UserRole.NIKITA;
  }

  isSurvivor(): boolean {
    return this.role === UserRole.SURVIVOR;
  }
}


