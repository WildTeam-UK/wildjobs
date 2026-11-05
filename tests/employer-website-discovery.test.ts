import { beforeEach, expect, it, vi } from "vitest";
import { discoverEmployerWebsite } from "../lib/employer-website-discovery";

const mocks = vi.hoisted(() => ({ create: vi.fn(), home: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: class {
    responses = { create: mocks.create };
  },
}));
vi.mock("../lib/employer-research-sources", () => ({ loadEmployerResearchHome: mocks.home }));

beforeEach(() => vi.resetAllMocks());

function searchResult(output: string, citation: string) {
  return {
    status: "completed",
    output_text: output,
    output: [
      { type: "web_search_call" },
      {
        type: "message",
        content: [{ type: "output_text", annotations: [{ type: "url_citation", url: citation }] }],
      },
    ],
  };
}

it("accepts a cited candidate only after its official site identifies the employer", async () => {
  mocks.create.mockResolvedValue(searchResult("https://trust.org.uk/ ", "https://trust.org.uk/about"));
  mocks.home.mockResolvedValue({ identity: "verified", home: { url: "https://trust.org.uk/" } });
  await expect(discoverEmployerWebsite("Example Trust", [])).resolves.toMatchObject({
    website: "https://trust.org.uk",
  });
  expect(mocks.home).toHaveBeenCalledWith("Example Trust", "https://trust.org.uk");
});

it("does not fetch a model-generated URL when the citation is for another domain", async () => {
  mocks.create.mockResolvedValue(searchResult("https://wrong.org.uk/", "https://trust.org.uk/about"));
  await expect(discoverEmployerWebsite("Example Trust", [])).resolves.toMatchObject({ website: null });
  expect(mocks.home).not.toHaveBeenCalled();
});

it("does not accept a cited website if the site's own identity check fails", async () => {
  mocks.create.mockResolvedValue(searchResult("https://trust.org.uk", "https://trust.org.uk/about"));
  mocks.home.mockResolvedValue({ identity: "mismatch" });
  await expect(discoverEmployerWebsite("Example Trust", [])).resolves.toMatchObject({ website: null });
});
