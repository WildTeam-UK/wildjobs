import { expect, it } from "vitest";
import { sanitizeGuideEvidenceText } from "../lib/guide-evidence-privacy";
it.each(["_dissimuloSSO", "access_token", "session-token", "api_key", "X-Amz-Signature"])(
  "removes %s values from application links",
  (key) => {
    const text = `Full time. Apply at https://apply.example.test/job?role=ecologist&${key}=example-value-123. Salary £30,000 per year.`;
    const safe = sanitizeGuideEvidenceText(text);
    expect(safe).not.toContain("example-value-123");
    expect(safe).not.toContain("apply.example.test");
    expect(safe).toContain("Full time.");
    expect(safe).toContain("Salary £30,000 per year.");
  },
);
it("preserves ordinary source URLs and redacts encoded or standalone credential parameters", () => {
  const ordinary = "Source https://example.test/jobs/123?ref=directory. Full time";
  expect(sanitizeGuideEvidenceText(ordinary)).toBe(ordinary);
  for (const input of [
    "https://example.test/apply?next=job%26_dissimuloSSO%3Dexample-value-123",
    "_dissimuloSSO=example-value-123",
    "access_token: example-value-123",
  ])
    expect(sanitizeGuideEvidenceText(input)).not.toContain("example-value-123");
});
