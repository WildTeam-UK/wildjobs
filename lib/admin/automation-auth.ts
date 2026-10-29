import { timingSafeEqual } from "node:crypto";

export function isAutomationRequestAuthorized(authorization: string | null, secret: string | undefined) {
  if (!authorization || !secret || secret.length < 16) return false;

  const supplied = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
