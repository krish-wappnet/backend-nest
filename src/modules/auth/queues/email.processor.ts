/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  EMAIL_QUEUE_JOBS,
  EMAIL_QUEUE_NAME,
  type EmailQueueJobName,
} from './email-queue.constants';
import { MailerService } from '../services/mailer.service';
import { OtpEmailPayload } from './email-queue.service';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(
    job: Job<OtpEmailPayload, void, EmailQueueJobName>,
  ): Promise<void> {
    if (job.name === EMAIL_QUEUE_JOBS.SEND_OTP) {
      const payload = job.data;
      await this.mailerService.sendMail({
        to: payload.to,
        subject: 'Your verification code',
        text: `Your verification code is ${payload.otp}. It expires in ${payload.expiresInMinutes} minutes.`,
      });

      this.logger.log(`Processed OTP email job for ${payload.to}`);
      return;
    }

    this.logger.warn(`Unknown email job: ${job.name}`);
  }
}
