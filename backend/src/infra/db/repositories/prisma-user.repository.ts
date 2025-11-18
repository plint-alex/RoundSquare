import { UserRole as PrismaUserRole } from '@prisma/client';
import { getPrismaClient } from '../client.js';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { User } from '@/domain/users/user.entity.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { mapPrismaUserToDomain } from '../mappers/user.mapper.js';

function mapDomainRoleToPrisma(role: UserRole): PrismaUserRole {
  switch (role) {
    case UserRole.SURVIVOR:
      return PrismaUserRole.SURVIVOR;
    case UserRole.NIKITA:
      return PrismaUserRole.NIKITA;
    case UserRole.ADMIN:
      return PrismaUserRole.ADMIN;
  }
}

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapPrismaUserToDomain(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { username } });
    return user ? mapPrismaUserToDomain(user) : null;
  }

  async create(user: User): Promise<User> {
    const prisma = getPrismaClient();
    const created = await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        role: mapDomainRoleToPrisma(user.role),
      },
    });
    return mapPrismaUserToDomain(created);
  }

  async update(user: User): Promise<User> {
    const prisma = getPrismaClient();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: user.username,
        passwordHash: user.passwordHash,
        role: mapDomainRoleToPrisma(user.role),
      },
    });
    return mapPrismaUserToDomain(updated);
  }
}


