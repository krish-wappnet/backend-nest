import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserStatus } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    firstName?: string | null;
    lastName?: string | null;
    status?: UserStatus;
    emailVerified?: boolean;
  }): Promise<User> {
    const entity = this.repo.create({
      email: params.email,
      passwordHash: params.passwordHash,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      status: params.status,
      emailVerified: params.emailVerified,
    });

    return this.repo.save(entity);
  }

  async updateLoginSuccess(params: {
    userId: string;
    ip?: string | null;
  }): Promise<void> {
    await this.repo.update(
      { id: params.userId },
      {
        lastLoginAt: new Date(),
        lastLoginIp: params.ip ?? null,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    );
  }

  async recordFailedLogin(params: {
    userId: string;
    lockAfter: number;
    lockMinutes: number;
  }): Promise<void> {
    const user = await this.repo.findOne({ where: { id: params.userId } });
    if (!user) {
      return;
    }

    const nextFailedCount = (user.failedLoginCount ?? 0) + 1;
    const lockedUntil =
      nextFailedCount >= params.lockAfter
        ? new Date(Date.now() + params.lockMinutes * 60_000)
        : user.lockedUntil;

    await this.repo.update(
      { id: params.userId },
      { failedLoginCount: nextFailedCount, lockedUntil },
    );
  }

  async activateByEmail(email: string): Promise<void> {
    await this.repo.update(
      { email },
      {
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    );
  }
}
