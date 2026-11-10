import { z } from "zod";
import { publicUrl } from "./directory-url";

const webUrl = z
  .string()
  .max(2048)
  .transform((value) => publicUrl(value).toString());
export const sourceConfigSchema = z.object({
  kind: z.enum(["auto", "rss", "smartrecruiters", "lever", "icims", "html", "job", "manual"]).default("auto"),
  organisation: z.string().trim().max(160).default(""),
  listingSelector: z.string().trim().max(300).default(""),
  jobLinkSelector: z.string().trim().max(300).default(""),
  nextSelector: z.string().trim().max(300).default(""),
  emptySelector: z.string().trim().max(300).default(""),
  descriptionSelector: z.string().trim().max(300).default(""),
  // Cross-domain links must be explicitly configured, not followed from arbitrary page text.
  allowedOrigins: z.array(webUrl).max(8).default([]),
  intervalHours: z.number().int().min(1).max(168).default(12),
  manual: z
    .object({
      title: z.string().trim().min(3).max(300),
      description: z.string().trim().min(50).max(24000),
      location: z.string().trim().max(300).default(""),
      salary: z.string().trim().max(300).default(""),
      closesAt: z.string().datetime(),
    })
    .optional(),
});
export type SourceConfig = z.infer<typeof sourceConfigSchema>;
export type SourceInput = { url: string; name?: string; config?: Partial<SourceConfig> };
export type SourcePreview = {
  kind: string;
  checkedAt: string;
  count: number;
  liveCount: number;
  pages: number;
  complete: true;
  url: string;
  jobs: { title: string; organisation: string; location: string; url: string; closesAt: string | null }[];
};

export class SourceReadError extends Error {
  constructor(
    public readonly code: "unsupported" | "blocked" | "incomplete" | "permission",
    message: string,
  ) {
    super(message);
  }
}

export function sourceError(error: unknown) {
  const message = error instanceof Error ? error.message : "The source could not be checked.";
  return {
    code:
      error instanceof SourceReadError
        ? error.code
        : /HTTP (401|403|429)|robots/i.test(message)
          ? "blocked"
          : "incomplete",
    message: message.slice(0, 800),
  };
}
