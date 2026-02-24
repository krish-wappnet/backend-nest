import { ConflictException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { UserStatus } from './user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private readonly lockAfterFailedAttempts = 5;

  private readonly lockMinutes = 15;

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    firstName?: string | null;
    lastName?: string | null;
    status?: UserStatus;
    emailVerified?: boolean;
  }): Promise<User> {
    const existing = await this.usersRepository.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    return this.usersRepository.createUser(params);
  }

  updateLoginSuccess(params: {
    userId: string;
    ip?: string | null;
  }): Promise<void> {
    return this.usersRepository.updateLoginSuccess(params);
  }

  recordFailedLogin(params: { userId: string }): Promise<void> {
    return this.usersRepository.recordFailedLogin({
      userId: params.userId,
      lockAfter: this.lockAfterFailedAttempts,
      lockMinutes: this.lockMinutes,
    });
  }

  activateByEmail(email: string): Promise<void> {
    return this.usersRepository.activateByEmail(email);
  }
}
