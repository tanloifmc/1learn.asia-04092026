import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function hasValidSePaySignature(rawBody: string, signature: string | null) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function getSePayInstructions(paymentReference: string) {
  return {
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER ?? null,
    bankCode: process.env.SEPAY_BANK_CODE ?? null,
    transferContent: paymentReference,
  };
}
