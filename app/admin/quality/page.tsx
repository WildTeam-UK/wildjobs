import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { liveDirectoryDateFilter } from "@/lib/directory-lifecycle";
import { cleanJobTitle } from "@/lib/job-title";
import { getPublishedEmployerIndex } from "@/lib/public-employer-profiles";
import { employerPageSlugs } from "@/lib/employer-page-slug";

export default async function QualityPage() {
  await requireStaff();
  const db = createTrustedClient();
  const [jobs, employers, profiles] = await Promise.all([
    (async () => {
      const rows: {
        id: number;
        title: string;
        organisation_name: string;
        feed_hash: string;
        processed_hash: string | null;
        attributes_version: number;
        source_url: string;
      }[] = [];
      for (let from = 0; ; from += 1000) {
        const result = await db
          .from("directory_jobs")
          .select("id,title,organisation_name,feed_hash,processed_hash,source_url,attributes_version")
          .eq("is_active", true)
          .is("merged_into", null)
          .or(liveDirectoryDateFilter())
          .order("id")
          .range(from, from + 999);
        if (result.error) throw new Error("Job quality could not be loaded.");
        rows.push(...result.data);
        if (result.data.length < 1000) return rows;
      }
    })(),
    (async () => {
      const rows: { name: string; logo_url: string | null; website_url: string | null }[] = [];
      for (let from = 0; ; from += 1000) {
        const result = await db
          .from("directory_organisations")
          .select("name,logo_url,website_url")
          .order("name")
          .range(from, from + 999);
        if (result.error) throw new Error("Employer quality could not be loaded.");
        rows.push(...result.data);
        if (result.data.length < 1000) return rows;
      }
    })(),
    getPublishedEmployerIndex(),
  ]);
  const branding = new Map(employers.map((employer) => [employer.name, employer]));
  const slugs = employerPageSlugs(employers, profiles);
  const researched = new Set(profiles.map((profile) => profile.organisation_name));
  const missingLogos = jobs.filter((job) => !branding.get(job.organisation_name)?.logo_url);
  const cleanTitles = jobs.filter((job) => cleanJobTitle(job.title) !== job.title);
  const pendingSummaries = jobs.filter((job) => job.feed_hash !== job.processed_hash);
  const basicPages = new Set(
    jobs
      .filter((job) => !researched.has(job.organisation_name) && slugs.has(job.organisation_name))
      .map((job) => job.organisation_name),
  );
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Automatic quality checks</p>
          <h1>Job and employer quality</h1>
        </div>
        <p>Missing branding and research never hold otherwise valid jobs for approval</p>
      </header>
      <section className="staff-summary shell">
        <div>
          <span>{jobs.filter((job) => job.attributes_version < 1).length}</span>
          <strong>Attribute extraction queued automatically</strong>
        </div>
        <div>
          <span>{jobs.length}</span>
          <strong>Current jobs checked</strong>
        </div>
        <div>
          <span>{missingLogos.length}</span>
          <strong>Jobs awaiting an employer logo</strong>
        </div>
        <div>
          <span>{cleanTitles.length}</span>
          <strong>Source titles cleaned automatically</strong>
        </div>
        <div>
          <span>{pendingSummaries.length}</span>
          <strong>Summaries queued automatically</strong>
        </div>
      </section>
      <section className="staff-section shell">
        <h2>Employer branding</h2>
        <p>
          Logos are shared across each employer’s jobs. The importer attempts discovery, and scheduled
          employer research retries missing logos using the verified official website. An unsuccessful lookup
          keeps the readable initials fallback. Existing logo overrides are preserved.
        </p>
        <p>
          <Link href="/admin/organisations">Manage employer logos</Link>
        </p>
        {missingLogos.length ? (
          <ul>
            {[...new Set(missingLogos.map((job) => job.organisation_name))].map((name) => (
              <li key={name}>
                {name} ·{" "}
                {branding.get(name)?.website_url
                  ? "Official website recorded; branding retry available to automation"
                  : "Official website discovery pending"}
              </li>
            ))}
          </ul>
        ) : (
          <p>All current jobs have a stored employer logo</p>
        )}
      </section>
      <section className="staff-section shell">
        <h2>Employer pages</h2>
        <p>
          Every named employer receives a jobs-based page as soon as its organisation is imported.{" "}
          {basicPages.size} current employers have basic pages while official-source research continues.
          Researched profiles add supported information automatically; this is separate from job publication.
        </p>
      </section>
      <section className="staff-section shell">
        <h2>Role title cleanup</h2>
        <p>
          Cards remove introductory recruitment wording and labels such as “Role:”. The original title and
          advert remain available as source evidence.
        </p>
        {cleanTitles.length ? (
          <table>
            <thead>
              <tr>
                <th>Source title</th>
                <th>Displayed title</th>
                <th>Employer</th>
              </tr>
            </thead>
            <tbody>
              {cleanTitles.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{cleanJobTitle(job.title)}</td>
                  <td>{job.organisation_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No source titles currently require cleanup</p>
        )}
      </section>
      <section className="staff-section shell">
        <h2>Skills and guides</h2>
        <p>
          Skills and advertised benefits are extracted into a fixed vocabulary in the existing enrichment
          pass. Supporting excerpts stay with the private source snapshot. Current jobs are backfilled
          automatically. Career guides publish automatically after ten detailed matching adverts from at least
          two employers, with current research sources; unsupported or separately edited content is preserved
          for attention.
        </p>
        <p>
          <Link href="/admin/guides">View guide evidence and publication status</Link>
        </p>
      </section>
    </main>
  );
}
