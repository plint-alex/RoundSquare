import { describe, it, expect } from 'vitest';
import { deriveRoleFromUsername } from '@/domain/users/role-derivation.js';
import { UserRole } from '@/domain/users/role.enum.js';

describe('Role Derivation', () => {
  it('should return ADMIN for "admin" (case-insensitive)', () => {
    expect(deriveRoleFromUsername('admin')).toBe(UserRole.ADMIN);
    expect(deriveRoleFromUsername('Admin')).toBe(UserRole.ADMIN);
    expect(deriveRoleFromUsername('ADMIN')).toBe(UserRole.ADMIN);
    expect(deriveRoleFromUsername('AdMiN')).toBe(UserRole.ADMIN);
  });

  it('should return NIKITA for "nikita" (case-insensitive)', () => {
    expect(deriveRoleFromUsername('nikita')).toBe(UserRole.NIKITA);
    expect(deriveRoleFromUsername('Nikita')).toBe(UserRole.NIKITA);
    expect(deriveRoleFromUsername('NIKITA')).toBe(UserRole.NIKITA);
    expect(deriveRoleFromUsername('NiKiTa')).toBe(UserRole.NIKITA);
  });

  it('should return SURVIVOR for other usernames', () => {
    expect(deriveRoleFromUsername('survivor1')).toBe(UserRole.SURVIVOR);
    expect(deriveRoleFromUsername('player')).toBe(UserRole.SURVIVOR);
    expect(deriveRoleFromUsername('user123')).toBe(UserRole.SURVIVOR);
    expect(deriveRoleFromUsername('')).toBe(UserRole.SURVIVOR);
  });

  it('should trim whitespace before deriving role', () => {
    expect(deriveRoleFromUsername(' admin ')).toBe(UserRole.ADMIN);
    expect(deriveRoleFromUsername(' nikita ')).toBe(UserRole.NIKITA);
    expect(deriveRoleFromUsername(' player ')).toBe(UserRole.SURVIVOR);
  });
});


