import { BrandWordmark } from "@wildteam-uk/ui";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label="WildJobs home">
          <BrandWordmark className="brand__wordmark" product="JOBS" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/jobs">Find jobs</Link>
          <Link href="/careers">Explore careers</Link>
          <Link href="/employers">Employers</Link>
          <Link href="/for-employers">For employers</Link>
          <Link className="site-nav__saved" href="/account/saved">
            Saved jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
