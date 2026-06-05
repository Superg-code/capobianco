import { Resend } from "resend";

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(opts: EmailOptions): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY non configurata — email non inviata");
    return { sent: false, error: "RESEND_API_KEY non configurata" };
  }

  const from = process.env.EMAIL_FROM ?? "Capobianco CRM <noreply@capobiancocrm.com>";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("Resend error:", error);
    return { sent: false, error: error.message };
  }

  return { sent: true };
}
