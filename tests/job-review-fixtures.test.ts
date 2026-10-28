import { describe, expect, it } from "vitest";
import {
  parsePreviewJobState,
  reviewJob,
  reviewRecordBySlug,
  reviewRecords,
} from "../lib/job-review-fixtures";

describe("staff review fixtures", () => {
  it("connects every review record to a fixture job", () => {
    expect(reviewRecords.every((record) => reviewJob(record))).toBe(true);
  });

  it("finds review records by job slug", () => {
    expect(reviewRecordBySlug("marine-restoration-officer")?.status).toBe("Needs review");
  });

  it("accepts only supported public preview states", () => {
    expect(parsePreviewJobState("expired")).toBe("expired");
    expect(parsePreviewJobState("withdrawn")).toBe("withdrawn");
    expect(parsePreviewJobState("unexpected")).toBe("active");
    expect(parsePreviewJobState(["expired", "withdrawn"])).toBe("active");
  });
});
