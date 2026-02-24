import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UserStatus } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { OtpRepository } from '../repositories/otp.repository';
import { OtpGenerator } from '../utils/otp-generator.util';
import { OtpHasher } from '../utils/otp-hasher.util';
import { EmailQueueService } from '../queues/email-queue.service';

export type OtpPurpose = 'EMAIL_VERIFICATION';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  private readonly otpLength = 6;
  private readonly maxAttempts = 5;
  private readonly expiryMs = 5 * 60_000;
  private readonly resendCooldownMs = 30_000;

  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly usersService: UsersService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async issueEmailVerificationOtp(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified || user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Email already verified');
    }

    const last = await this.otpRepository.findLatestByEmail(email);
    if (last) {
      const elapsed = Date.now() - last.createdAt.getTime();
      if (elapsed < this.resendCooldownMs) {
        throw new HttpException(
          'OTP resend is allowed only after 30 seconds',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.otpRepository.invalidateAll(email);

    const otp = OtpGenerator.generateNumeric(this.otpLength);
    const otpHash = await OtpHasher.hash(otp);
    const expiresAt = new Date(Date.now() + this.expiryMs);

    await this.otpRepository.createOtp({ email, otpHash, expiresAt });

    await this.emailQueue.enqueueOtpEmail({
      to: email,
      otp,
      purpose: 'EMAIL_VERIFICATION',
      expiresInMinutes: Math.floor(this.expiryMs / 60_000),
    });

    this.logger.log(`Issued email verification OTP for ${email}`);
  }

  async verifyEmailOtp(params: { email: string; otp: string }): Promise<void> {
    const user = await this.usersService.findByEmail(params.email);
    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.emailVerified && user.status === UserStatus.ACTIVE) {
      return;
    }

    const record = await this.otpRepository.findLatestActive(params.email);
    if (!record) {
      throw new BadRequestException('Invalid OTP');
    }

    if (record.used) {
      throw new BadRequestException('Invalid OTP');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.otpRepository.markUsed(record.id);
      throw new BadRequestException('OTP has expired');
    }

    if ((record.attempts ?? 0) >= this.maxAttempts) {
      throw new BadRequestException('OTP attempts exceeded');
    }

    const ok = await OtpHasher.compare(params.otp, record.otpHash);
    if (!ok) {
      await this.otpRepository.incrementAttempts(record.id);
      throw new BadRequestException('Invalid OTP');
    }

    await this.otpRepository.markUsed(record.id);
    await this.otpRepository.invalidateAll(params.email);
    await this.usersService.activateByEmail(params.email);

    this.logger.log(`Verified email OTP for ${params.email}`);
  }
}
