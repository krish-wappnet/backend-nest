import { ConflictException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { UserStatus } from './user.entity';
import { VendorStatus } from './vendor-status.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private readonly lockAfterFailedAttempts = 5;

  private readonly lockMinutes = 15;

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  updateVendorFlags(params: {
    userId: string;
    isVendor: boolean;
    vendorStatus: VendorStatus | null;
  }): Promise<void> {
    return this.usersRepository.updateVendorFlags(params);
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
