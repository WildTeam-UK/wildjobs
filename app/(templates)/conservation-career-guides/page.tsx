import type { Metadata } from "next";
import Link from "next/link";
import { TemplatePhoto } from "@/components/templates/template-parts";

export const metadata: Metadata = {
  title: "Conservation career guides",
  description: "Explore conservation careers, routes into the work and skills for your next step.",
};

export default function CareerGuidesPage() {
  return (
    <main>
      <section className="tpl-hero shell">
        <div className="tpl-hero__grid">
          <div>
            <h1>
              Find your <span className="tpl-gradient">path in conservation.</span>
            </h1>
            <p className="tpl-hero__lead">
              Understand the work, explore the routes in and discover practical ways to build your skills. Our
              career guides help you plan your next step with more confidence.
            </p>
            <div className="tpl-actions">
              <Link className="action" href="/conservation-career-guides/ecologist">
                EXPLORE ECOLOGY
              </Link>
            </div>
          </div>
          <TemplatePhoto kind="woodland" priority />
        </div>
      </section>
      <section className="content-section">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <h2>Explore a career.</h2>
            <p>
              Start with the work that interests you, then look at the experience and training that could help
              you get there.
            </p>
          </div>
          <div className="pathway-grid">
            <Link className="career-pathway-card" href="/conservation-career-guides/ecologist">
              <span className="career-pathway-card__number">CAREER GUIDE</span>
              <div className="career-pathway-card__body">
                <h3>Ecologist</h3>
                <p>
                  Use evidence about species and habitats to help protect nature. Explore qualifications,
                  field experience, salaries and progression.
                </p>
              </div>
              <strong>
                READ THE GUIDE <span aria-hidden="true">→</span>
              </strong>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
