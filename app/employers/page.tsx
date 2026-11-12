import { pageMetadata } from "@/lib/page-metadata";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEmployerDirectory } from "@/lib/public-employers";
import { EmployerDirectory } from "./employer-directory";
import styles from "./employer-directory.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Conservation employers",
  description:
    "Explore conservation employers and environmental organisations. Browse employer profiles and find opportunities in wildlife conservation, ecology and sustainability.",
  path: "/employers",
});

export default async function EmployersPage() {
  const { employers, sectors, countries } = await getPublicEmployerDirectory();

  return (
    <main className={`${styles.page} shell`}>
      <header className={styles.heading}>
        <p className="eyebrow">Employer directory</p>
        <h1>Explore conservation organisations</h1>
        <p className={styles.description}>
          Discover conservation employers in the UK and internationally, from wildlife charities and
          environmental consultancies to organisations restoring habitats and protecting species. Browse
          employer profiles to learn about their work, explore the sectors they recruit in and find current
          opportunities on WildJobs. Use the search, sector and country filters to find organisations that
          interest you, or show only employers with live vacancies. Whether you’re starting a conservation
          career or planning your next move, explore the directory below or{" "}
          <Link href="/">see all conservation jobs</Link>.
        </p>
      </header>
      {employers.length ? (
        <EmployerDirectory countries={countries} employers={employers} sectors={sectors} />
      ) : (
        <div className="staff-empty-state">
          <h2>No organisations to show yet</h2>
          <p>The directory updates as employer profiles and vacancies are published.</p>
        </div>
      )}
    </main>
  );
}
