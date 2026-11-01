import { isAutomationRequestAuthorized } from "@/lib/admin/automation-auth";
import { syncDirectory } from "@/lib/directory-sync";
export const maxDuration = 150;
export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request.headers.get("authorization"), process.env.AUTOMATION_SECRET))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await syncDirectory());
  } catch {
    return Response.json({ error: "Feed processing failed. See admin for details." }, { status: 500 });
  }
}
