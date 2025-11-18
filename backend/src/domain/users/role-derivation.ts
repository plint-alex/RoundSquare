import { UserRole } from './role.enum.js';

/**
 * Derives user role from username.
 * - "admin" (case-insensitive) → ADMIN
 * - "nikita" (case-insensitive) → NIKITA
 * - Everything else → SURVIVOR
 */
export function deriveRoleFromUsername(username: string): UserRole {
  const normalized = username.toLowerCase().trim();

  if (normalized === 'admin') {
    return UserRole.ADMIN;
  }

  if (normalized === 'nikita') {
    return UserRole.NIKITA;
  }

  return UserRole.SURVIVOR;
}


