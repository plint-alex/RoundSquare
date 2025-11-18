import { User } from '../users/user.entity.js';
import { UserRole } from '../users/role.enum.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}


