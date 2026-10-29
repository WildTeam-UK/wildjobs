import { revalidatePath } from "next/cache";

import { redeemSubmissionInvite } from "@/lib/employer-submissions/data";
import { validateEmployerSubmission } from "@/lib/employer-submissions/validation";

const responseHeaders = { "Cache-Control": "no-store" };
const maximumRequestBytes = 20_000;

function json(body: object, status: number) {
  return Response.json(body, { headers: responseHeaders, status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return json({ message: "This request could not be verified.", ok: false }, 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ message: "This submission format is not supported.", ok: false }, 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumRequestBytes) {
    return json({ message: "This submission is too large.", ok: false }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maximumRequestBytes) {
    return json({ message: "This submission is too large.", ok: false }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ message: "The submission could not be read. Please try again.", ok: false }, 400);
  }

  const result = validateEmployerSubmission(body);
  if (!result.data) return json({ message: result.error, ok: false }, 400);

  if (result.data.website) {
    return json({ ok: true }, 201);
  }

  const redemption = await redeemSubmissionInvite(result.data);
  if (redemption.status === "unavailable") {
    return json({ message: "This invitation link is unavailable.", ok: false }, 409);
  }
  if (redemption.status === "failed") {
    return json({ message: "Your submission could not be saved. Please try again.", ok: false }, 500);
  }

  revalidatePath("/admin/submissions");
  return json({ ok: true }, 201);
}
