import { logger } from "@repo/logger";
import { env } from "../env";
import { resendClient } from "../clients/resend";

type SendVerificationCodeInput = {
  email: string;
  otp: string;
};

export async function sendEmailVerificationCode(input: SendVerificationCodeInput): Promise<void> {
  const subject = "Your verification code";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verify your email</h2>
      <p>Use this 6-digit code to verify your email address:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${input.otp}</p>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const { error } = await resendClient.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.email,
    subject,
    html,
  });

  if (error) {
    logger.error("Failed to send verification email", { error, to: input.email });
    throw new Error("Failed to send verification email");
  }
}
