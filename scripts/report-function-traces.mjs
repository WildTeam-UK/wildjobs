import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

// Inspect an existing production build without credentials or network requests.
// These are uncompressed route traces, not Vercel's grouped archives or billed usage.
const root = process.cwd();
const sizes = new Map();

async function traces(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return traces(path);
      return entry.name.endsWith(".nft.json") ? [path] : [];
    }),
  );
  return nested.flat();
}

async function fileSize(path) {
  if (!sizes.has(path)) {
    const info = await stat(path);
    sizes.set(path, info.isFile() ? info.size : 0);
  }
  return sizes.get(path);
}

const reports = [];
for (const trace of await traces(resolve(root, ".next/server"))) {
  const { files } = JSON.parse(await readFile(trace, "utf8"));
  const paths = new Set([
    trace.slice(0, -".nft.json".length),
    ...files.map((file) => resolve(dirname(trace), file)),
  ]);
  const entries = await Promise.all(
    [...paths].map(async (path) => ({ path: relative(root, path), bytes: await fileSize(path) })),
  );
  reports.push({
    trace: relative(root, trace),
    bytes: entries.reduce((total, file) => total + file.bytes, 0),
    nativeImageFiles: entries.filter((file) => /(?:sharp|libvips)/.test(file.path)).length,
    pdfFiles: entries.filter((file) => /unpdf/.test(file.path)).length,
    largestFiles: entries.sort((a, b) => b.bytes - a.bytes).slice(0, 5),
  });
}
console.log(
  JSON.stringify(
    {
      measurement: "Uncompressed Next.js route traces; shared files repeat across routes",
      routes: reports.sort((a, b) => b.bytes - a.bytes),
    },
    null,
    2,
  ),
);
