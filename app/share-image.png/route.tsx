import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  const font = await readFile(join(process.cwd(), "public/fonts/vag-rounded-bold.woff"));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "#fef3e5",
        color: "#6e0f6c",
        fontFamily: "VAG Rounded",
        borderBottom: "20px solid #e60088",
      }}
    >
      <div style={{ display: "flex", fontSize: 72 }}>
        Wild<span style={{ color: "#e60088" }}>Jobs</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 76, lineHeight: 1.1 }}>Find your place in conservation</div>
        <div style={{ fontSize: 30, marginTop: 24, color: "#303030" }}>
          Jobs, employers and practical career guidance from WildTeam
        </div>
      </div>
      <div style={{ fontSize: 24 }}>jobs.wildteam.org.uk</div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "VAG Rounded", data: font, weight: 700, style: "normal" }],
    },
  );
}
