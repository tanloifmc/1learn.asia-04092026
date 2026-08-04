import "server-only";
import { Resend } from "resend";

export async function sendTransactionalEmail(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { skipped: true as const };
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({ from, to: input.to, subject: input.subject, html: input.html, text: input.text }, { headers: { "Idempotency-Key": input.idempotencyKey } });
  if (error) throw new Error(`Resend failed: ${error.message}`);
  return { skipped: false as const, id: data?.id ?? null };
}
