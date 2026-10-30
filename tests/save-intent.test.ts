import { describe, expect, it } from "vitest";

import { addSaveStatus, getSaveJobIntent } from "../lib/auth/save-intent";

describe("getSaveJobIntent", () => {
  it("keeps a valid job and safe return path", () => {
    expect(
      getSaveJobIntent({
        intent: "save",
        job: "senior-reserves-officer",
        next: "/jobs/senior-reserves-officer?from=search",
      }),
    ).toEqual({
      jobSlug: "senior-reserves-officer",
      next: "/jobs/senior-reserves-officer?from=search",
    });
  });

  it("uses the job page when no return path is supplied", () => {
    expect(getSaveJobIntent({ intent: "save", job: "ecologist" })).toEqual({
      jobSlug: "ecologist",
      next: "/jobs/ecologist",
    });
  });

  it.each([
    { intent: "view", job: "ecologist" },
    { intent: "save", job: "../../admin" },
    { intent: "save", job: "Role With Spaces" },
    { intent: "save", job: undefined },
  ])("rejects invalid save intent %#", (values) => {
    expect(getSaveJobIntent(values)).toBeNull();
  });
});

describe("addSaveStatus", () => {
  it("preserves an internal path while adding the result", () => {
    expect(addSaveStatus("/jobs/ecologist?from=search#details", "saved")).toBe(
      "/jobs/ecologist?from=search&save=saved#details",
    );
  });

  it("does not permit an external return path", () => {
    expect(addSaveStatus("https://example.com", "saved")).toBe("/?save=saved");
  });
});
