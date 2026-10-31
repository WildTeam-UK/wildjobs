import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLearnWorldsCourses } from "../lib/learnworlds/client";

vi.mock("server-only", () => ({}));

function configureLearnWorlds() {
  vi.stubEnv("LEARNWORLDS_ACCESS_TOKEN", "test-access-token");
  vi.stubEnv("LEARNWORLDS_API_URL", "https://api.example.learnworlds.com/admin/api/v2");
  vi.stubEnv("LEARNWORLDS_COURSE_CATEGORY", "ONLINE COURSE");
  vi.stubEnv("LEARNWORLDS_CLIENT_ID", "test-client-id");
  vi.stubEnv("LEARNWORLDS_PUBLIC_BASE_URL", "https://training.wildteam.org.uk/");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("LearnWorlds course catalogue client", () => {
  it("filters the catalogue by category and availability while keeping credentials in server headers", async () => {
    configureLearnWorlds();
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: [
              {
                access: "paid",
                categories: ["ONLINE COURSE", "CPD"],
                courseImage: "https://cdn.learnworlds.example/approved-course.jpg",
                description: "<p>Build <strong>practical</strong> conservation skills.</p>",
                id: "approved-course",
                title: "Approved course",
              },
              {
                access: "paid",
                categories: ["TRAINER PACK"],
                id: "trainer-pack",
                title: "Trainer pack",
              },
              {
                access: "Coming Soon",
                categories: ["ONLINE COURSE"],
                id: "draft-course",
                title: "Draft course",
              },
              {
                access: "free",
                categories: [{ name: "ONLINE COURSE" }],
                id: "free-course",
                title: "Free course",
              },
            ],
            meta: { total_pages: 1 },
          }),
          { headers: { "content-type": "application/json" }, status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchLearnWorldsCourses();

    expect(result).toEqual([
      {
        availabilityStatus: "available",
        id: "approved-course",
        imageUrl: "https://cdn.learnworlds.example/approved-course.jpg",
        publicUrl: "https://training.wildteam.org.uk/course/approved-course",
        summary: "Build practical conservation skills.",
        title: "Approved course",
      },
      {
        availabilityStatus: "available",
        id: "free-course",
        imageUrl: null,
        publicUrl: "https://training.wildteam.org.uk/course/free-course",
        summary: "Free course",
        title: "Free course",
      },
    ]);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.example.learnworlds.com/admin/api/v2/courses?page=1");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer test-access-token",
      "Lw-Client": "test-client-id",
    });
  });

  it("rejects an API base that is not HTTPS version 2", async () => {
    configureLearnWorlds();
    vi.stubEnv("LEARNWORLDS_API_URL", "http://api.example.learnworlds.com/admin/api/v1");

    await expect(fetchLearnWorldsCourses()).rejects.toThrow(
      "LEARNWORLDS_API_URL must be a credential-free HTTPS URL.",
    );
  });

  it("rejects an empty category response so an API mismatch cannot disable the catalogue", async () => {
    configureLearnWorlds();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ data: [], meta: { total_pages: 1 } }), {
            headers: { "content-type": "application/json" },
            status: 200,
          }),
      ),
    );

    await expect(fetchLearnWorldsCourses()).rejects.toThrow(
      "LearnWorlds did not return any available courses in the ONLINE COURSE category.",
    );
  });
});
