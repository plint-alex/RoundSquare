import { describe, it, expect } from 'vitest';
import { User } from '@/domain/users/user.entity.js';
import { UserRole } from '@/domain/users/role.enum.js';

describe('User Entity', () => {
  it('should create a user with correct properties', () => {
    const user = User.create(
      '123e4567-e89b-12d3-a456-426614174000',
      'testuser',
      'hashedpassword',
      UserRole.SURVIVOR
    );

    expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(user.username).toBe('testuser');
    expect(user.passwordHash).toBe('hashedpassword');
    expect(user.role).toBe(UserRole.SURVIVOR);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('should correctly identify admin role', () => {
    const admin = User.create('1', 'admin', 'hash', UserRole.ADMIN);
    expect(admin.isAdmin()).toBe(true);
    expect(admin.isNikita()).toBe(false);
    expect(admin.isSurvivor()).toBe(false);
  });

  it('should correctly identify Nikita role', () => {
    const nikita = User.create('2', 'nikita', 'hash', UserRole.NIKITA);
    expect(nikita.isAdmin()).toBe(false);
    expect(nikita.isNikita()).toBe(true);
    expect(nikita.isSurvivor()).toBe(false);
  });

  it('should correctly identify survivor role', () => {
    const survivor = User.create('3', 'survivor', 'hash', UserRole.SURVIVOR);
    expect(survivor.isAdmin()).toBe(false);
    expect(survivor.isNikita()).toBe(false);
    expect(survivor.isSurvivor()).toBe(true);
  });
});


