import { isAutomationRequestAuthorized } from "@/lib/admin/automation-auth";
import { researchEmployer } from "@/lib/employer-research";

export const maxDuration = 90;

export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request.headers.get("authorization"), process.env.AUTOMATION_SECRET))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.VERCEL_ENV !== "production") return Response.json({ status: "disabled" });
  try {
    const body: unknown = await request.json().catch(() => null);
    const pilot = body && typeof body === "object" && "pilot" in body ? body.pilot : undefined;
    if (pilot !== undefined && (typeof pilot !== "string" || !pilot.trim() || pilot.length > 180))
      return Response.json({ error: "Invalid pilot employer" }, { status: 400 });
    return Response.json(await researchEmployer(pilot?.trim()));
  } catch {
    return Response.json({ error: "Employer research could not run." }, { status: 500 });
  }
}
