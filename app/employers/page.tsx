import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEmployerDirectory } from "@/lib/public-employers";
import { EmployerDirectory } from "./employer-directory";
import styles from "./employer-directory.module.css";

export const metadata: Metadata = { title: "Conservation employers" };

export default async function EmployersPage() {
  const { employers, sectors } = await getPublicEmployerDirectory();

  return (
    <main className={`${styles.page} shell`}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">Employer directory</p>
          <h1>Explore conservation organisations</h1>
          <p className={styles.description}>
            Browse conservation employers, learn about their work and see who’s hiring on WildJobs.
          </p>
        </div>
        <Link className="site-navigation-button site-navigation-button--outline" href="/">
          See all jobs
        </Link>
      </header>
      {employers.length ? (
        <EmployerDirectory employers={employers} sectors={sectors} />
      ) : (
        <div className="staff-empty-state">
          <h2>No organisations to show yet</h2>
          <p>The directory updates as employer profiles and vacancies are published.</p>
        </div>
      )}
    </main>
  );
}
