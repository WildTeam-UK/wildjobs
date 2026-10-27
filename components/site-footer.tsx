export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <p className="site-footer__brand">
            <span>WILD</span>JOBS
          </p>
          <p>Conservation opportunities presented clearly, with the source always visible.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="https://www.wildteam.org.uk/team" target="_blank" rel="noopener noreferrer">
            Our team
          </a>
          <a href="https://training.wildteam.org.uk/courses" target="_blank" rel="noopener noreferrer">
            Training
          </a>
          <a href="https://training.wildteam.org.uk/privacy" target="_blank" rel="noopener noreferrer">
            Privacy
          </a>
        </nav>
      </div>
      <div className="shell site-footer__legal">
        WILDTEAM is a registered charity in England and Wales. Number 1149465. © {new Date().getFullYear()}{" "}
        WildTeam
      </div>
    </footer>
  );
}
