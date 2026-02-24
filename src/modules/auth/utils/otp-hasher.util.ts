import * as bcrypt from 'bcrypt';

export class OtpHasher {
  static hash(otp: string): Promise<string> {
    return bcrypt.hash(otp, 12);
  }

  static compare(otp: string, otpHash: string): Promise<boolean> {
    return bcrypt.compare(otp, otpHash);
  }
}
