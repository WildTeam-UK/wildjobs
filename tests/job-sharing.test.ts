import { expect, it, vi } from "vitest";
import { shareJob } from "../lib/job-sharing";

const url = "https://example.org/jobs/ecologist";
const title = "Ecologist at Nature Trust";

it("prefers the native share sheet and shares the specific advert", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  const writeText = vi.fn();
  expect(await shareJob(title, url, { share, clipboard: { writeText } })).toBe("shared");
  expect(share).toHaveBeenCalledWith({ title, text: title, url });
  expect(writeText).not.toHaveBeenCalled();
});

it("does not copy anything when the user cancels native sharing", async () => {
  const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
  const writeText = vi.fn();
  expect(await shareJob(title, url, { share, clipboard: { writeText } })).toBe("cancelled");
  expect(writeText).not.toHaveBeenCalled();
});

it("copies the advert link when native sharing is unavailable", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  expect(await shareJob(title, url, { clipboard: { writeText } })).toBe("copied");
  expect(writeText).toHaveBeenCalledWith(url);
});

it("falls back to copying after a native share failure", async () => {
  const share = vi.fn().mockRejectedValue(new Error("Unavailable"));
  const writeText = vi.fn().mockResolvedValue(undefined);
  expect(await shareJob(title, url, { share, clipboard: { writeText } })).toBe("copied");
});

it("requests a selectable-link fallback when clipboard access is blocked or absent", async () => {
  const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
  expect(await shareJob(title, url, { clipboard: { writeText } })).toBe("unavailable");
  expect(await shareJob(title, url, {})).toBe("unavailable");
});
