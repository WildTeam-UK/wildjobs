import { expect, it, vi } from "vitest";
import { collectEmployerSources } from "../lib/employer-research-sources";

const { fetchPage } = vi.hoisted(() => ({ fetchPage: vi.fn() }));
vi.mock("../lib/directory-http", () => ({ fetchPublicResearchPage: fetchPage }));

it("finds the organisation's own about page and a programme despite earlier subject and navigation links", async () => {
  const origin = "https://trust.example.org";
  const prose =
    "Example Trust protects wildlife by improving habitat and studying changes in local species. Its volunteers carry out annual surveys and provide practical support for conservation projects.";
  const pages: Record<string, string> = {
    "/robots.txt": "User-agent: *\nDisallow: /our-work/private-project",
    "/": `<title>Example Trust</title><main><p>${prose}</p></main><nav>
      <a href="/about-bats">About bats</a><a href="/about-bats/where-they-live">Where bats live</a>
      <a href="/our-work/helpline">Helpline</a><a href="/our-work/campaigns">Campaigns</a>
      <a href="/the-trust">About us</a><a href="/our-work">Our work</a>
      <a href="/the-trust/jobs-careers">Jobs and careers</a>
    </nav>`,
    "/the-trust": `<title>About Us</title><main><p>${prose}</p></main>`,
    "/our-work": `<title>Our Work</title><main><p>${prose}</p>
      <a href="/our-work/private-project">Private project</a>
      <a href="https://elsewhere.example.org/project">Outside project</a>
      <a href="/our-work/national-monitoring-programme">National Monitoring Programme</a>
    </main>`,
    "/our-work/national-monitoring-programme": `<title>National Monitoring Programme</title><main><p>${prose}</p></main>`,
    "/the-trust/jobs-careers": `<title>Careers</title><main><p>${prose}</p></main>`,
  };
  fetchPage.mockImplementation(async (value: string, _timeout: number, allow: (url: URL) => boolean) => {
    const url = new URL(value);
    expect(allow(url)).toBe(true);
    if (!(url.pathname in pages)) throw new Error("Source HTTP 404");
    return { url: url.href, text: pages[url.pathname], contentType: "text/html" };
  });

  const result = await collectEmployerSources("Example Trust", origin);
  expect(result.sources).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: "about", url: origin + "/the-trust" }),
      expect.objectContaining({ kind: "work", url: origin + "/our-work/national-monitoring-programme" }),
      expect.objectContaining({ kind: "careers", url: origin + "/the-trust/jobs-careers" }),
    ]),
  );
  expect(fetchPage.mock.calls.map(([url]) => url)).not.toContain(origin + "/about-bats");
  expect(fetchPage.mock.calls.map(([url]) => url)).not.toContain(origin + "/our-work/private-project");
  expect(fetchPage.mock.calls.map(([url]) => url)).not.toContain("https://elsewhere.example.org/project");
});
