import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { loadPublicLogo } from "@/lib/directory-http";
import { employerLogoVersion } from "@/lib/employer-logo-path";

export const runtime = "nodejs";
export const maxDuration = 15;

const checkedLogo = unstable_cache(
  async (name: string, version: string) => {
    const result = await createPublicClient()
      .from("directory_organisations")
      .select("logo_url")
      .eq("name", name)
      .maybeSingle();
    if (result.error) throw new Error("Logo unavailable");
    const url = result.data?.logo_url;
    if (!url || employerLogoVersion(url) !== version) return null;
    const image = await loadPublicLogo(url);
    return image?.png.toString("base64") ?? null;
  },
  ["visible-employer-logo-v1"],
  { revalidate: 3600 },
);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const name = params.get("name") ?? "",
    version = params.get("v") ?? "";
  if (!name.trim() || name.length > 300 || !/^[a-f0-9]{1,8}$/.test(version))
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const image = await checkedLogo(name, version);
    if (!image) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(new Uint8Array(Buffer.from(image, "base64")), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
