import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginService } from '@/app/auth/login.service.js';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { User } from '@/domain/users/user.entity.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { InvalidCredentialsError } from '@/shared/errors/auth.errors.js';
import { resetConfig } from '@/shared/config.js';

describe('LoginService', () => {
  let loginService: LoginService;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';
    process.env.AUTH_COOKIE_MAX_AGE = '3600000';
    resetConfig();

    mockUserRepository = {
      findById: vi.fn(),
      findByUsername: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    loginService = new LoginService(mockUserRepository);
  });

  it('should create new user on first login', async () => {
    const username = 'newuser';
    const password = 'password123';

    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(mockUserRepository.create).mockImplementation(async (user) => user);

    const result = await loginService.login(username, password);

    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(result.user.username).toBe(username);
    expect(result.user.role).toBe(UserRole.SURVIVOR);
    expect(result.token).toBeDefined();
  });

  it('should derive ADMIN role for admin username', async () => {
    const username = 'admin';
    const password = 'password123';

    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(mockUserRepository.create).mockImplementation(async (user) => user);

    const result = await loginService.login(username, password);

    expect(result.user.role).toBe(UserRole.ADMIN);
  });

  it('should derive NIKITA role for nikita username', async () => {
    const username = 'nikita';
    const password = 'password123';

    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(mockUserRepository.create).mockImplementation(async (user) => user);

    const result = await loginService.login(username, password);

    expect(result.user.role).toBe(UserRole.NIKITA);
  });

  it('should login existing user with correct password', async () => {
    const username = 'existinguser';
    const password = 'correctpassword';
    const passwordHash = '$2b$10$rQZ8XK9YvJZ8XK9YvJZ8XOuZ8XK9YvJZ8XK9YvJZ8XK9YvJZ8XK9Yu'; // Mock hash

    const existingUser = User.create('user-id', username, passwordHash, UserRole.SURVIVOR);

    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(existingUser);

    // Mock bcrypt to return true for password verification
    const bcrypt = await import('bcrypt');
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await loginService.login(username, password);

    expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(result.user.id).toBe(existingUser.id);
    expect(result.token).toBeDefined();
  });

  it('should throw InvalidCredentialsError for wrong password', async () => {
    const username = 'existinguser';
    const password = 'wrongpassword';
    const passwordHash = '$2b$10$rQZ8XK9YvJZ8XK9YvJZ8XOuZ8XK9YvJZ8XK9YvJZ8XK9YvJZ8XK9Yu';

    const existingUser = User.create('user-id', username, passwordHash, UserRole.SURVIVOR);

    vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(existingUser);

    // Mock bcrypt to return false for password verification
    const bcrypt = await import('bcrypt');
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(loginService.login(username, password)).rejects.toThrow(InvalidCredentialsError);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});


