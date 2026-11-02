import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import type { RequestOptions } from "node:https";
import { fetchPublicText, fetchWebsiteIcon, verifyPublicImage } from "../lib/directory-http";
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), https: vi.fn(), http: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:https", () => ({ request: mocks.https }));
vi.mock("node:http", () => ({ request: mocks.http }));
function response(text: string, status = 200, headers: Record<string, string> = {}) {
  mocks.https.mockImplementationOnce(
    (_url: URL, _options: RequestOptions, callback: (response: Readable) => void) => {
      const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: (error: Error) => void };
      req.destroy = (error) => {
        req.emit("error", error);
      };
      req.end = () => {
        const stream = Readable.from([Buffer.from(text)]) as Readable & {
          statusCode: number;
          headers: Record<string, string>;
        };
        stream.statusCode = status;
        stream.headers = headers;
        callback(stream);
      };
      return req;
    },
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
});
describe("public feed HTTP reader", () => {
  it("pins the validated DNS result for the actual request", async () => {
    response("<rss/>");
    expect(await fetchPublicText("https://jobs.example.org/feed")).toEqual({
      text: "<rss/>",
      url: "https://jobs.example.org/feed",
    });
    const options = mocks.https.mock.calls[0][1] as RequestOptions;
    const callback = vi.fn();
    options.lookup?.("jobs.example.org", { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [{ address: "8.8.8.8", family: 4 }]);
  });
  it("does not connect when a public hostname resolves to a private network", async () => {
    mocks.lookup.mockResolvedValue([{ address: "10.0.0.1", family: 4 }]);
    await expect(fetchPublicText("https://jobs.example.org/feed")).rejects.toThrow("public web server");
    expect(mocks.https).not.toHaveBeenCalled();
  });
  it("rejects redirects into internal services", async () => {
    response("", 302, { location: "http://169.254.169.254/latest" });
    await expect(fetchPublicText("https://jobs.example.org/feed")).rejects.toThrow("public HTTP");
    expect(mocks.http).not.toHaveBeenCalled();
  });
  it("follows a public redirect and returns the final URL for relative advert links", async () => {
    response("", 301, { location: "/feeds/jobs.xml" });
    response("<rss/>");
    expect((await fetchPublicText("https://jobs.example.org/feed")).url).toBe(
      "https://jobs.example.org/feeds/jobs.xml",
    );
  });
  it("bounds response size", async () => {
    response("x".repeat(3_000_001));
    await expect(fetchPublicText("https://jobs.example.org/feed")).rejects.toThrow("too large");
  });
  it("accepts an actual image response and rejects HTML masquerading as an image", async () => {
    response("image bytes", 200, { "content-type": "image/png" });
    expect(await verifyPublicImage("https://nature.org/logo.png")).toBe("https://nature.org/logo.png");
    response("<html>Not an image</html>", 200, { "content-type": "text/html" });
    expect(await verifyPublicImage("https://nature.org/missing-logo.png")).toBeNull();
  });
  it("caches website icons as embedded images and rejects the missing-icon response", async () => {
    response("png", 200, { "content-type": "image/png" });
    expect(await fetchWebsiteIcon("https://nature.org")).toMatch(/^data:image\/svg\+xml,/);
    response("generic icon", 404, { "content-type": "image/png" });
    expect(await fetchWebsiteIcon("https://missing.org")).toBeNull();
  });
});
