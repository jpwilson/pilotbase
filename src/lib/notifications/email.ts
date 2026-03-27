import { logger } from "@/lib/utils/logger";

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
  operatorId: string;
}

/**
 * Send email notification.
 *
 * Primary path: FSP handles email when `sendEmailNotification: true` on reservation creation.
 * This service is for custom communications (offers, confirmations outside FSP).
 *
 * Implementation: Use Azure Communication Services, SendGrid, or similar.
 * Currently stubbed — logs the email and returns success.
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean }> {
  logger.info("Email notification (stub)", {
    to: params.to,
    subject: params.subject,
    operatorId: params.operatorId,
  });

  // TODO: Implement with Azure Communication Services or SendGrid
  // const client = new EmailClient(connectionString);
  // await client.beginSend({ ... });

  return { success: true };
}
