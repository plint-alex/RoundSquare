import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { User } from '@/domain/users/user.entity.js';
import { UserRole } from '@/domain/users/role.enum.js';

function mapPrismaRoleToDomain(role: PrismaUserRole): UserRole {
  switch (role) {
    case PrismaUserRole.SURVIVOR:
      return UserRole.SURVIVOR;
    case PrismaUserRole.NIKITA:
      return UserRole.NIKITA;
    case PrismaUserRole.ADMIN:
      return UserRole.ADMIN;
    default:
      throw new Error(`Unknown user role: ${role}`);
  }
}

export function mapPrismaUserToDomain(prismaUser: PrismaUser): User {
  return new User(
    prismaUser.id,
    prismaUser.username,
    prismaUser.passwordHash,
    mapPrismaRoleToDomain(prismaUser.role),
    prismaUser.createdAt,
    prismaUser.updatedAt
  );
}


