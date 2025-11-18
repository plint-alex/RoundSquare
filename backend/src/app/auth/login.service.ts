import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { User } from '@/domain/users/user.entity.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { deriveRoleFromUsername } from '@/domain/users/role-derivation.js';
import { hashPassword, verifyPassword } from '@/domain/users/password.service.js';
import { generateToken } from '@/infra/auth/jwt.service.js';
import { InvalidCredentialsError } from '@/shared/errors/auth.errors.js';

export interface LoginResult {
  user: User;
  token: string;
}

export class LoginService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(username: string, password: string): Promise<LoginResult> {
    // Check if user exists
    const existingUser = await this.userRepository.findByUsername(username);

    if (!existingUser) {
      // Create new user
      const role = deriveRoleFromUsername(username);
      const passwordHash = await hashPassword(password);
      const newUser = User.create(uuidv4(), username, passwordHash, role);
      const createdUser = await this.userRepository.create(newUser);
      const token = generateToken(createdUser.id, createdUser.role);

      return {
        user: createdUser,
        token,
      };
    }

    // Verify password for existing user
    const isValidPassword = await verifyPassword(password, existingUser.passwordHash);

    if (!isValidPassword) {
      throw new InvalidCredentialsError('Invalid username or password');
    }

    // Generate token for authenticated user
    const token = generateToken(existingUser.id, existingUser.role);

    return {
      user: existingUser,
      token,
    };
  }
}


