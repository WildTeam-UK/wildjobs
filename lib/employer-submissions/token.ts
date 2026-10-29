import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const submissionInviteTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function hashSubmissionInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSubmissionInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSubmissionInviteToken(token) };
}
