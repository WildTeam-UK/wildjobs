import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Brand and style guide",
  description: "The working visual standard for WildTeam digital products.",
  robots: { index: false, follow: false, noarchive: true },
};

const colours = [
  ["WildTeam purple", "#6E0F6C", "swatch--purple"],
  ["WildTeam pink", "#E60088", "swatch--pink"],
  ["Gradient middle", "#B41E8E", "swatch--middle"],
  ["Ink", "#080808", "swatch--ink"],
  ["Cream", "#FEF3E5", "swatch--cream"],
  ["Paper", "#FFFFFF", "swatch--paper"],
] as const;

export default function StyleGuidePage() {
  return (
    <main className="guide-page">
      <header className="guide-hero">
        <div className="shell guide-hero__layout">
          <div>
            <p className="eyebrow">WildTeam digital system</p>
            <h1>
              One brand.
              <br />
              One visual language.
            </h1>
          </div>
          <div className="guide-hero__intro">
            <p>
              The working source of truth for typography, colour, controls and reusable interface patterns.
            </p>
            <Link className="action action--white" href="/">
              View WildJobs <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="shell guide-sections">
        <section className="guide-section" aria-labelledby="guide-type">
          <div className="guide-section__heading">
            <p className="eyebrow">01 — Typography</p>
            <h2 id="guide-type">VAG Rounded everywhere</h2>
            <p>
              Regular for reading, bold for controls and black for display. No substitute typeface in the
              finished product.
            </p>
          </div>
          <div className="type-specimens">
            <div>
              <span>Display / black</span>
              <strong className="type-display">Wild ideas need wild people</strong>
            </div>
            <div>
              <span>Heading / black</span>
              <strong className="type-heading">Conservation that works</strong>
            </div>
            <div>
              <span>Lead / regular</span>
              <p className="type-lead">
                A clear, friendly introduction that gives the next action room to breathe.
              </p>
            </div>
            <div>
              <span>Body / regular</span>
              <p className="type-body">
                Comfortable reading text for articles, job descriptions, guidance and supporting information.
              </p>
            </div>
            <div>
              <span>Label / bold uppercase</span>
              <strong className="type-label">Conservation careers</strong>
            </div>
          </div>
        </section>

        <section className="guide-section" aria-labelledby="guide-colour">
          <div className="guide-section__heading">
            <p className="eyebrow">02 — Colour</p>
            <h2 id="guide-colour">Focused, warm and recognisable</h2>
          </div>
          <div className="colour-grid">
            {colours.map(([name, value, className]) => (
              <div className={`colour-card ${className}`} key={name}>
                <div aria-hidden="true" />
                <strong>{name}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section" aria-labelledby="guide-actions">
          <div className="guide-section__heading">
            <p className="eyebrow">03 — Buttons and links</p>
            <h2 id="guide-actions">Pink first. Purple on hover.</h2>
            <p>
              White actions become pink on hover. Every action keeps a strong, visible keyboard focus state.
            </p>
          </div>
          <div className="guide-demo guide-demo--dark">
            <a className="action action--primary" href="#guide-actions">
              Primary action <span aria-hidden="true">→</span>
            </a>
            <a className="action action--white" href="#guide-actions">
              White action <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#guide-actions">
              Text action <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section className="guide-section" aria-labelledby="guide-pills">
          <div className="guide-section__heading">
            <p className="eyebrow">04 — Labels and pills</p>
            <h2 id="guide-pills">Compact labels with one shared behaviour</h2>
            <p>
              Every interactive pill becomes pink with white text on hover. Panel and pill radii are both
              18px.
            </p>
          </div>
          <div className="guide-demo">
            <button className="label-pill" type="button">
              Conservation
            </button>
            <button className="label-pill" type="button">
              Remote
            </button>
            <button className="label-pill label-pill--fancy" type="button">
              <span aria-hidden="true">✦</span> Featured
            </button>
            <button className="label-pill label-pill--dark" type="button">
              Closing soon
            </button>
          </div>
        </section>

        <section className="guide-section" aria-labelledby="guide-surfaces">
          <div className="guide-section__heading">
            <p className="eyebrow">05 — Surfaces and CTAs</p>
            <h2 id="guide-surfaces">Flat surfaces. Clear hierarchy.</h2>
            <p>Panels use colour, whitespace and subtle rules—not chunky outlines or offset shadows.</p>
          </div>
          <div className="surface-grid">
            <article className="surface-card surface-card--cream">
              <p className="eyebrow">Cream panel</p>
              <h3>Warm supporting content</h3>
              <p>Useful for filters, summaries and gentle calls to action.</p>
            </article>
            <article className="surface-card surface-card--dark">
              <p className="eyebrow">Dark panel</p>
              <h3>High-contrast emphasis</h3>
              <p>Best for strong ecosystem links and end-of-page actions.</p>
            </article>
          </div>
          <div className="inline-cta">
            <div>
              <p className="eyebrow">Build your conservation career</p>
              <h3>Turn your ambition into practical skills</h3>
              <p>Keep the copy and next action in one clear, aligned row.</p>
            </div>
            <a className="action action--white" href="https://training.wildteam.org.uk/courses">
              Explore training <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
