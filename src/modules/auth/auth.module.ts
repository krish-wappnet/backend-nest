import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { UserOtp } from './entities/user-otp.entity';
import { OtpRepository } from './repositories/otp.repository';
import { OtpService } from './services/otp.service';
import { EMAIL_QUEUE_NAME } from './queues/email-queue.constants';
import { EmailQueueService } from './queues/email-queue.service';
import { EmailProcessor } from './queues/email.processor';
import { MailerService } from './services/mailer.service';
import { SmtpMailerService } from './services/smtp-mailer.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule,
    UsersModule,
    TypeOrmModule.forFeature([UserOtp]),
    BullModule.registerQueue({ name: EMAIL_QUEUE_NAME }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OtpRepository,
    OtpService,
    EmailQueueService,
    EmailProcessor,
    {
      provide: MailerService,
      useClass: SmtpMailerService,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
