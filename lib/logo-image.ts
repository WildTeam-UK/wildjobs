import sharp from "sharp";

// Logos must have visible detail against the white surfaces used throughout WildJobs.
// Bound both the compressed input and decoded image before sampling or serving it.
export async function prepareLogoImage(body: Buffer): Promise<Buffer | null> {
  if (!body.length || body.length > 3_000_000) return null;
  // Only UTF-8 SVG is accepted; inspect the whole bounded document, including padded XML.
  if ((body[0] === 0xff && body[1] === 0xfe) || (body[0] === 0xfe && body[1] === 0xff)) return null;
  const svg = body.toString("utf8");
  if (/<svg\b/i.test(svg)) {
    if (
      /<!DOCTYPE|<!ENTITY|<script\b|<foreignObject\b|\bon\w+\s*=|@import/i.test(svg) ||
      [...svg.matchAll(/(?:\b(?:xlink:)?href\s*=\s*["']([^"']*)["']|url\(\s*["']?([^\s)'";]+))/gi)].some(
        (match) => !/^(?:#|data:image\/(?:png|jpeg|webp|avif);base64,)/i.test(match[1] ?? match[2]),
      )
    )
      return null;
  }
  try {
    const input = sharp(body, { limitInputPixels: 16_000_000, pages: 1 }).timeout({ seconds: 2 });
    const metadata = await input.metadata();
    if (!metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) < 64) return null;
    const { data, info } = await input
      .clone()
      .resize(128, 128, { fit: "inside" })
      .toColourspace("srgb")
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let ink = 0;
    const minimum = [255, 255, 255],
      maximum = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      let darkest = 255;
      for (let channel = 0; channel < 3; channel++) {
        const value = 255 + (data[i + channel] - 255) * alpha;
        minimum[channel] = Math.min(minimum[channel], value);
        maximum[channel] = Math.max(maximum[channel], value);
        darkest = Math.min(darkest, value);
      }
      if (darkest < 225) ink++;
    }
    if (ink < info.width * info.height * 0.005 || !maximum.some((value, i) => value - minimum[i] >= 20))
      return null;
    // Serve a bounded raster snapshot, never executable SVG or mutable remote image bytes.
    return await input
      .autoOrient()
      .resize(384, 384, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}
