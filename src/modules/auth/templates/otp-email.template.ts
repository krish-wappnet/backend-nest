export type OtpEmailTemplateParams = {
  otp: string;
  expiresInMinutes: number;
};

export function renderOtpEmailHtml(params: OtpEmailTemplateParams): string {
  const otp = escapeHtml(params.otp);
  const expiresIn = String(params.expiresInMinutes);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verification code</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e8eaf0;">
        <h2 style="margin:0 0 12px 0;color:#111827;font-size:20px;line-height:28px;">Your verification code</h2>
        <p style="margin:0 0 16px 0;color:#374151;font-size:14px;line-height:22px;">
          Use the following one-time code to verify your email.
        </p>
        <div style="font-size:28px;letter-spacing:6px;font-weight:700;color:#111827;background:#f3f4f6;border-radius:10px;padding:14px 16px;text-align:center;">
          ${otp}
        </div>
        <p style="margin:16px 0 0 0;color:#6b7280;font-size:12px;line-height:18px;">
          This code expires in ${expiresIn} minutes.
        </p>
      </div>
      <p style="margin:14px 0 0 0;color:#9ca3af;font-size:12px;line-height:18px;text-align:center;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
