import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { updateLogo } from "../actions";
import { SubmitButton } from "@/components/submit-button";
export default async function OrganisationsAdmin() {
  await requireStaff();
  const { data, error } = await createTrustedClient()
    .from("directory_organisations")
    .select("*")
    .order("name");
  if (error) throw new Error("Organisations could not be loaded.");
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Organisation logos</p>
          <h1>Logos for job cards.</h1>
        </div>
        <p>
          The RSS feed does not supply logos. Known logos are reused; other cards show organisation initials.
        </p>
      </header>
      <section className="staff-section shell">
        {data.map((o) => (
          <form action={updateLogo} key={o.name}>
            <h2>{o.name}</h2>
            <input name="name" type="hidden" value={o.name} />
            <label>
              Logo URL
              <input type="url" name="logo_url" defaultValue={o.logo_url ?? ""} placeholder="https://…" />
            </label>
            <SubmitButton idleLabel="Save logo" pendingLabel="Saving…" />
          </form>
        ))}
      </section>
    </main>
  );
}
