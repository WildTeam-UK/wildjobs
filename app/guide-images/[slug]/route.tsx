import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { guideCatalog } from "@/lib/guide-content";
import { guideImageSize, guideSeoCopy } from "@/lib/guide-seo";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return [...guideCatalog.map(({ slug }) => ({ slug })), { slug: "guides" }];
}

// Keep the file tracer within the two image collections used by the guide catalogue.
// A computed path beneath public/ would copy every public asset into the fallback function.
async function readGuidePhoto(image: string) {
  if (/^\/images\/sectors\/[^/]+$/.test(image))
    return readFile(join(process.cwd(), "public/images/sectors", image.slice("/images/sectors/".length)));
  if (/^\/images\/design\/[^/]+$/.test(image))
    return readFile(join(process.cwd(), "public/images/design", image.slice("/images/design/".length)));
  throw new Error("Guide sharing images must use the sectors or design image collection.");
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideCatalog.find((guide) => guide.slug === slug);
  if (!guide && slug !== "guides") return new Response("Not found", { status: 404 });
  const copy = guide
    ? guideSeoCopy(guide)
    : {
        imageTitle: "Find your place in conservation",
        imageSubtitle: "Explore our sector and career guides",
      };
  const [font, photo] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/vag-rounded-bold.woff")),
    readGuidePhoto(guide?.image ?? "/images/design/woodland.jpg"),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#fff",
        fontFamily: "VAG Rounded",
        color: "#303030",
        padding: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "60%",
          paddingRight: 40,
        }}
      >
        <div style={{ display: "flex", fontSize: 42, color: "#6e0f6c" }}>
          Wild<span style={{ color: "#e60088" }}>Jobs</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#6e0f6c",
              marginBottom: 20,
            }}
          >
            {guide ? `Conservation ${guide.kind} guide` : "Conservation career guides"}
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.02, letterSpacing: -2 }}>{copy.imageTitle}</div>
          <div style={{ fontSize: 28, lineHeight: 1.3, marginTop: 24, color: "#535353" }}>
            {copy.imageSubtitle}
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#6e0f6c" }}>jobs.wildteam.org.uk</div>
      </div>
      {/* ImageResponse embeds this local asset; Next/Image is for HTML pages. */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        alt=""
        src={`data:image/${guide?.image.endsWith(".png") ? "png" : "jpeg"};base64,${photo.toString("base64")}`}
        width={444}
        height={542}
        style={{
          objectFit: guide && !guide.photoCredit ? "contain" : "cover",
          borderRadius: 28,
          background: "#f5eff7",
        }}
      />
    </div>,
    {
      ...guideImageSize,
      fonts: [
        {
          name: "VAG Rounded",
          data: font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
