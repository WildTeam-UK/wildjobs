import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchApprovedLearnWorldsCourses } from "../lib/learnworlds/client";

vi.mock("server-only", () => ({}));

function configureLearnWorlds() {
  vi.stubEnv("LEARNWORLDS_ACCESS_TOKEN", "test-access-token");
  vi.stubEnv("LEARNWORLDS_API_URL", "https://api.example.learnworlds.com/admin/api/v2");
  vi.stubEnv("LEARNWORLDS_APPROVED_COURSE_IDS", "approved-course,draft-course");
  vi.stubEnv("LEARNWORLDS_CLIENT_ID", "test-client-id");
  vi.stubEnv("LEARNWORLDS_PUBLIC_BASE_URL", "https://training.wildteam.org.uk/");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("LearnWorlds course catalogue client", () => {
  it("returns only approved courses and keeps credentials in server request headers", async () => {
    configureLearnWorlds();
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            data: [
              {
                access: "paid",
                description: "<p>Build <strong>practical</strong> conservation skills.</p>",
                id: "approved-course",
                title: "Approved course",
              },
              {
                access: "paid",
                description: "Should not be imported.",
                id: "not-approved",
                title: "Not approved",
              },
              {
                access: "draft",
                id: "draft-course",
                title: "Draft course",
              },
            ],
            meta: { total_pages: 1 },
          }),
          { headers: { "content-type": "application/json" }, status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchApprovedLearnWorldsCourses();

    expect(result.courses).toEqual([
      {
        availabilityStatus: "available",
        id: "approved-course",
        publicUrl: "https://training.wildteam.org.uk/course/approved-course",
        summary: "Build practical conservation skills.",
        title: "Approved course",
      },
      {
        availabilityStatus: "unavailable",
        id: "draft-course",
        publicUrl: "https://training.wildteam.org.uk/course/draft-course",
        summary: "Draft course",
        title: "Draft course",
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

    await expect(fetchApprovedLearnWorldsCourses()).rejects.toThrow(
      "LEARNWORLDS_API_URL must be a credential-free HTTPS URL.",
    );
  });
});
