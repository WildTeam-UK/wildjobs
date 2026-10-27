import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label="WildJobs home">
          <span className="brand__wild">WILD</span>
          <span className="brand__product">JOBS</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/">Find jobs</Link>
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
