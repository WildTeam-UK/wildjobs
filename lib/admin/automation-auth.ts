import { timingSafeEqual } from "node:crypto";

export function isAutomationRequestAuthorized(authorization: string | null, secret: string | undefined) {
  const normalizedSecret = secret?.trim();
  if (!authorization || !normalizedSecret || normalizedSecret.length < 16) return false;

  const supplied = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${normalizedSecret}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
