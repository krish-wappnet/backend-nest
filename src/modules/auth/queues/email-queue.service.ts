import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  EMAIL_QUEUE_JOBS,
  EMAIL_QUEUE_NAME,
  type EmailQueueJobName,
} from './email-queue.constants';

export type OtpEmailPayload = {
  to: string;
  otp: string;
  purpose: 'EMAIL_VERIFICATION';
  expiresInMinutes: number;
};

@Injectable()
export class EmailQueueService {
  constructor(
    @Inject(`BullQueue_${EMAIL_QUEUE_NAME}`)
    private readonly queue: Queue<OtpEmailPayload, void, EmailQueueJobName>,
  ) {}

  async enqueueOtpEmail(payload: OtpEmailPayload): Promise<void> {
    await this.queue.add(EMAIL_QUEUE_JOBS.SEND_OTP, payload, {
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
    });
  }
}
