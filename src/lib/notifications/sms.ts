import { logger } from "@/lib/utils/logger";

export interface SmsParams {
  to: string;
  body: string;
  operatorId: string;
}

/**
 * Send SMS notification via Twilio.
 *
 * Currently stubbed — logs the message and returns success.
 * Behind feature flag: only active when operator has SMS enabled.
 */
export async function sendSms(params: SmsParams): Promise<{ success: boolean; sid?: string }> {
  logger.info("SMS notification (stub)", {
    to: params.to,
    operatorId: params.operatorId,
  });

  // TODO: Implement with Twilio
  // const client = twilio(accountSid, authToken);
  // const message = await client.messages.create({
  //   body: params.body,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: params.to,
  // });

  return { success: true };
}
