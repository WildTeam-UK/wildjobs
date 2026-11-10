import sharp from "sharp";
import { expect, it } from "vitest";
import { prepareLogoImage } from "../lib/logo-image";
const svg = (content: string, size = 128) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${content}</svg>`);
it.each(["#fff", "#FFFFFE", "transparent"])("rejects a %s mark that disappears on white", async (fill) => {
  expect(await prepareLogoImage(svg(`<circle cx="64" cy="64" r="50" fill="${fill}"/>`))).toBeNull();
});
it("rejects empty, undersized, malformed and uniform placeholders", async () => {
  for (const input of [
    svg(""),
    svg('<path d="M0 0h20v20z"/>', 20),
    Buffer.from("not an image"),
    await sharp({ create: { width: 128, height: 128, channels: 4, background: "green" } })
      .png()
      .toBuffer(),
  ])
    expect(await prepareLogoImage(input)).toBeNull();
});
it("keeps genuine white lettering on a dark background and returns a safe bounded PNG", async () => {
  const input = svg(
    '<rect width="128" height="128" fill="#00553f"/><circle cx="64" cy="64" r="40" fill="white"/>',
  );
  const png = await prepareLogoImage(input);
  expect(png).not.toBeNull();
  expect(await sharp(png!).metadata()).toMatchObject({ format: "png", width: 128, height: 128 });
});
it("rejects transparent and all-white raster images too", async () => {
  for (const background of ["white", { r: 0, g: 0, b: 0, alpha: 0 }]) {
    const png = await sharp({ create: { width: 128, height: 128, channels: 4, background } })
      .png()
      .toBuffer();
    expect(await prepareLogoImage(png)).toBeNull();
  }
});
it("rejects external SVG resources and active content before decoding", async () => {
  for (const content of [
    '<image href="https://127.0.0.1/logo.png"/>',
    "<script>alert(1)</script>",
    '<style>@import "https://internal/style.css";</style>',
  ])
    expect(await prepareLogoImage(svg(content))).toBeNull();
});
