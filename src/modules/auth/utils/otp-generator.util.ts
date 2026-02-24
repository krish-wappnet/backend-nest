export class OtpGenerator {
  static generateNumeric(length = 6): string {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    const n = Math.floor(min + Math.random() * (max - min + 1));
    return String(n);
  }
}
