export const EMAIL_QUEUE_NAME = 'email';

export const EMAIL_QUEUE_JOBS = {
  SEND_OTP: 'send-otp',
} as const;

export type EmailQueueJobName =
  (typeof EMAIL_QUEUE_JOBS)[keyof typeof EMAIL_QUEUE_JOBS];
