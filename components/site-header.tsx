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
          <Link href="/">Find jobs</Link>
          <Link href="/style-guide">Brand guide</Link>
          <a href="https://training.wildteam.org.uk/courses" target="_blank" rel="noopener noreferrer">
            Build your skills
          </a>
          <a href="https://www.wildteam.org.uk/" target="_blank" rel="noopener noreferrer">
            About WildTeam
          </a>
        </nav>
      </div>
    </header>
  );
}
