import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOtp } from '../entities/user-otp.entity';

@Injectable()
export class OtpRepository {
  constructor(
    @InjectRepository(UserOtp)
    private readonly repo: Repository<UserOtp>,
  ) {}

  async createOtp(params: {
    email: string;
    otpHash: string;
    expiresAt: Date;
  }): Promise<UserOtp> {
    const entity = this.repo.create({
      email: params.email,
      otpHash: params.otpHash,
      expiresAt: params.expiresAt,
    });

    return this.repo.save(entity);
  }

  invalidateAll(email: string): Promise<void> {
    return this.repo
      .createQueryBuilder()
      .update(UserOtp)
      .set({ used: true })
      .where('email = :email', { email })
      .andWhere('used = false')
      .execute()
      .then(() => undefined);
  }

  findLatestActive(email: string): Promise<UserOtp | null> {
    return this.repo.findOne({
      where: { email, used: false },
      order: { createdAt: 'DESC' },
    });
  }

  findLatestByEmail(email: string): Promise<UserOtp | null> {
    return this.repo.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(UserOtp)
      .set({ attempts: () => 'attempts + 1' })
      .where('id = :id', { id })
      .execute();
  }

  markUsed(id: string): Promise<void> {
    return this.repo.update({ id }, { used: true }).then(() => undefined);
  }
}
