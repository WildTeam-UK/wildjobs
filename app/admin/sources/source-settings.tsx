import { sourceConfigSchema } from "@/lib/source-config";
import type { Json } from "@/lib/supabase/database.types";

export function SourceSettings({ configuration, notes = "" }: { configuration?: Json; notes?: string }) {
  const parsed = sourceConfigSchema.safeParse(configuration || {});
  const config = parsed.success ? parsed.data : sourceConfigSchema.parse({});
  return (
    <>
      <label>
        Reader
        <select name="kind" defaultValue={config.kind}>
          <option value="auto">Detect automatically</option>
          <option value="rss">RSS or Atom feed</option>
          <option value="smartrecruiters">SmartRecruiters</option>
          <option value="lever">Lever</option>
          <option value="icims">iCIMS</option>
          <option value="html">Careers page</option>
          <option value="job">Individual advert</option>
          <option value="manual">Manually entered advert</option>
        </select>
      </label>
      <label>
        Employer fallback
        <input name="organisation" defaultValue={config.organisation} maxLength={160} />
      </label>
      <p>
        Used when the source does not identify the employer. Leave blank for boards representing multiple
        employers.
      </p>
      <label>
        Check every (hours)
        <input
          type="number"
          name="interval_hours"
          min={1}
          max={168}
          step={1}
          defaultValue={config.intervalHours}
        />
      </label>
      <label>
        Source notes
        <textarea name="notes" defaultValue={notes} maxLength={2000} rows={3} />
      </label>
      <details>
        <summary>Careers-page settings</summary>
        <p>
          Use these when automatic detection needs help. The entire list, including every results page, must
          be covered.
        </p>
        <label>
          Vacancy section CSS selector
          <input
            name="listing_selector"
            defaultValue={config.listingSelector}
            maxLength={300}
            placeholder="main .vacancies"
          />
        </label>
        <label>
          Job links CSS selector
          <input
            name="job_link_selector"
            defaultValue={config.jobLinkSelector}
            maxLength={300}
            placeholder="a.vacancy-title"
          />
        </label>
        <label>
          Next page CSS selector
          <input
            name="next_selector"
            defaultValue={config.nextSelector}
            maxLength={300}
            placeholder="a[rel=next]"
          />
        </label>
        <label>
          No-vacancies message CSS selector
          <input name="empty_selector" defaultValue={config.emptySelector} maxLength={300} />
        </label>
        <label>
          Advert content CSS selector
          <input name="description_selector" defaultValue={config.descriptionSelector} maxLength={300} />
        </label>
        <label>
          Additional recruitment website origins
          <textarea
            name="allowed_origins"
            defaultValue={config.allowedOrigins.join("\n")}
            rows={2}
            placeholder="https://recruitment.example.org"
          />
        </label>
        <p>
          One public website origin per line. Only add websites that host this employer’s vacancies or
          documents.
        </p>
      </details>
      <details open={config.kind === "manual"}>
        <summary>Manual advert details</summary>
        <p>
          Select “Manually entered advert” above. Include an original public source URL, employer and
          confirmed closing date. Applications continue at the source.
        </p>
        <label>
          Job title
          <input name="job_title" defaultValue={config.manual?.title} maxLength={300} />
        </label>
        <label>
          Advert description
          <textarea
            name="job_description"
            defaultValue={config.manual?.description}
            minLength={50}
            maxLength={24000}
            rows={6}
          />
        </label>
        <label>
          Job location
          <input name="job_location" defaultValue={config.manual?.location} maxLength={300} />
        </label>
        <label>
          Advertised salary
          <input name="job_salary" defaultValue={config.manual?.salary} maxLength={300} />
        </label>
        <label>
          Closing date
          <input name="job_closes" type="date" defaultValue={config.manual?.closesAt.slice(0, 10)} />
        </label>
      </details>
    </>
  );
}
