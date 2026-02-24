export type SendMailParams = {
  to: string;
  subject: string;
  text: string;
};

export abstract class MailerService {
  abstract sendMail(params: SendMailParams): Promise<void>;
}
