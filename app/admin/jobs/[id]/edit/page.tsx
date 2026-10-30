import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { JobReviewForm, type ReviewFormValues } from "@/components/admin/job-review-form";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit vacancy review" };

type EditReviewPageProps = {
  params: Promise<{ id: string }>;
};

function text(value: string | null) {
  return value ?? "";
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const supabase = await createClient();
  const [jobResult, sourceResult] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, summary, description, responsibilities, requirements, status, location_text, locality, region, postal_code, country_code, workplace_type, engagement_type, contract_type, hours_type, experience_level, salary_text, application_url, posted_at, closes_at, employers(name, website_url, mission, overview)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("job_source_records")
      .select("canonical_url")
      .eq("job_id", id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (jobResult.error || sourceResult.error || !jobResult.data || !sourceResult.data) notFound();
  if (!["draft", "in_review"].includes(jobResult.data.status)) redirect(`/admin/jobs/${id}`);

  const job = jobResult.data;
  const values: ReviewFormValues = {
    applicationUrl: text(job.application_url),
    canonicalUrl: text(sourceResult.data.canonical_url),
    closesAt: text(job.closes_at),
    contractType: text(job.contract_type),
    countryCode: text(job.country_code),
    description: text(job.description),
    engagementType: text(job.engagement_type),
    employerMission: text(job.employers.mission),
    employerName: job.employers.name,
    employerOverview: text(job.employers.overview),
    employerWebsiteUrl: text(job.employers.website_url),
    experienceLevel: text(job.experience_level),
    hoursType: text(job.hours_type),
    locationLocality: text(job.locality),
    locationRegion: text(job.region),
    locationText: text(job.location_text),
    postalCode: text(job.postal_code),
    postedAt: text(job.posted_at),
    requirements: text(job.requirements),
    responsibilities: text(job.responsibilities),
    salaryText: text(job.salary_text),
    summary: text(job.summary),
    title: job.title,
    workplaceType: text(job.workplace_type),
  };

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href={`/admin/jobs/${id}`}>
          <span aria-hidden="true">←</span> Vacancy review
        </Link>
      </div>
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Private review draft</p>
          <h1>Edit reviewed details</h1>
        </div>
        <p>
          Compare every field with the authoritative source. Saving adds an audit entry but does not publish
          the vacancy.
        </p>
      </header>

      <section className="staff-section shell">
        <JobReviewForm jobId={id} today={new Date().toISOString().slice(0, 10)} values={values} />
      </section>
    </main>
  );
}
