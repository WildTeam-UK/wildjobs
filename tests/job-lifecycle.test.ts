import { describe, expect, it } from "vitest";

import { validateJobLifecycleReviewNote } from "../lib/admin/job-lifecycle";

describe("job lifecycle review notes", () => {
  it("normalises a useful audit note", () => {
    const formData = new FormData();
    formData.set("reviewNote", "  The employer confirmed that the vacancy has closed early.  ");

    expect(validateJobLifecycleReviewNote(formData)).toEqual({
      data: { reviewNote: "The employer confirmed that the vacancy has closed early." },
    });
  });

  it("rejects a note that is too short", () => {
    const formData = new FormData();
    formData.set("reviewNote", "Closed");

    expect(validateJobLifecycleReviewNote(formData)).toEqual({
      error: "Add a clear review note between 10 and 2,000 characters.",
    });
  });

  it("rejects a note above the audit limit", () => {
    const formData = new FormData();
    formData.set("reviewNote", "x".repeat(2001));

    expect(validateJobLifecycleReviewNote(formData)).toEqual({
      error: "Add a clear review note between 10 and 2,000 characters.",
    });
  });
});
