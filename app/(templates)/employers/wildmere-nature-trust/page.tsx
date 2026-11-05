import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EditorialImageCredit } from "@/components/editorial-image-credit";
import { RelatedGuides } from "@/components/guides/related-guides";
import {
  ExampleJobs,
  ExampleStats,
  LeafMark,
  Sparkle,
  TrainingBanner,
} from "@/components/templates/template-parts";
import { guideCatalog } from "@/lib/guide-content";
import { guideSectorLabels } from "@/lib/guide-sectors";
import wetlandPhoto from "@/public/images/design/wildmere-wetland.jpg";

const roleCategories = ["wildlife-conservation", "ecology"] as const;
const relatedGuides = ["ecologist", "project-manager", "wildlife-conservation"].flatMap((slug) => {
  const guide = guideCatalog.find((item) => item.slug === slug);
  return guide ? [guide] : [];
});

export const metadata: Metadata = {
  title: "Wildmere Nature Trust — employer profile",
  description:
    "Discover Wildmere Nature Trust’s mission, working environment and current conservation vacancies.",
};

export default function EmployerTemplate() {
  return (
    <main>
      <div className="shell tpl-employer-cover">
        <figure className="tpl-photo">
          <Image
            src={wetlandPhoto}
            alt="A pond surrounded by golden reedbeds at a UK nature reserve"
            sizes="(max-width: 1240px) 100vw, 1240px"
            preload
          />
          <EditorialImageCredit
            creatorName="Richard James"
            creatorUrl="https://unsplash.com/@r1chjames"
            sourceUrl="https://unsplash.com/photos/a-small-pond-surrounded-by-tall-grass-KTAKQdVSTcc"
          />
        </figure>
        <header className="tpl-employer-heading">
          <LeafMark />
          <div className="tpl-employer-heading__copy">
            <div className="tpl-employer-heading__title">
              <h1>Wildmere Nature Trust</h1>
              <a
                className="tpl-text-link tpl-employer-website"
                href="https://example.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website
              </a>
            </div>
            <ul className="tpl-employer-pills" aria-label="Hiring status and role categories">
              <li>
                <span className="tpl-employer-pill tpl-hiring-pill tpl-hiring-pill--fancy">
                  <Sparkle />
                  <span>Hiring now · 3 roles</span>
                </span>
              </li>
              {roleCategories.map((category) => (
                <li key={category}>
                  <Link
                    className="tpl-employer-pill tpl-employer-pill--category"
                    href={{ pathname: "/", query: { sector: guideSectorLabels[category] } }}
                  >
                    {guideSectorLabels[category]}
                  </Link>
                </li>
              ))}
            </ul>
            <p>Local nature charity · South West England</p>
          </div>
        </header>
      </div>
      <div className="shell">
        <nav className="tpl-profile-nav" aria-label="Employer profile sections">
          <a href="#about">About the organisation</a>
          <a href="#working-here">Working here</a>
          <a href="#hiring-history">Hiring snapshot</a>
          <a href="#jobs">Current jobs</a>
        </nav>
      </div>
      <section className="shell tpl-employer-grid" id="about">
        <div>
          <p className="eyebrow">Our mission</p>
          <h2>
            More wild places
            <br />
            <span className="tpl-gradient">More people connected to them</span>
          </h2>
          <p>
            Wildmere Nature Trust is a local conservation charity. Its mission is to restore a connected
            network of habitats and help communities take an active part in nature recovery.
          </p>
          <p>
            The trust brings together ecological evidence, practical land management and local knowledge. A
            small central team supports work across woodland, wetland and meadow sites, in partnership with
            landowners, community groups and volunteers.
          </p>
          <p>
            Our work brings together a range of conservation professionals: specialists who understand
            habitats, colleagues who coordinate projects and people who build relationships and make
            participation possible.
          </p>
        </div>
        <aside className="tpl-employer-facts">
          <h3>At a glance</h3>
          <dl>
            <div>
              <dt>Organisation type</dt>
              <dd>Conservation charity</dd>
            </div>
            <div>
              <dt>Based in</dt>
              <dd>Somerset, South West England</dd>
            </div>
            <div>
              <dt>Team size</dt>
              <dd>51–100 people</dd>
            </div>
            <div>
              <dt>Focus areas</dt>
              <dd>Habitat restoration, wildlife & communities</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="tpl-wide-section tpl-wide-section--white" id="working-here">
        <div className="shell">
          <div className="tpl-section-heading">
            <div>
              <p className="eyebrow">Working towards something together</p>
              <h2>
                A team with different skills
                <br />A shared purpose
              </h2>
            </div>
          </div>
          <div className="tpl-three-steps">
            <div>
              <span>01</span>
              <h3>Close to the work</h3>
              <p>
                Field staff, project teams and community colleagues share what they are learning, so evidence
                and practical experience can inform one another.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Built on relationships</h3>
              <p>
                The team works with local people and partner organisations, listening to different
                perspectives and making responsibilities clear.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>Room to develop</h3>
              <p>
                Our vacancies explain the supervision, learning opportunities and support available, helping
                applicants understand how they can grow.
              </p>
            </div>
          </div>
          <p className="tpl-small" style={{ marginTop: 24 }}>
            Working arrangements, benefits and essential requirements differ by role. Check each vacancy for
            the details that matter to your application.
          </p>
        </div>
      </section>

      <section className="shell tpl-wide-section" id="hiring-history">
        <div className="tpl-section-heading">
          <div>
            <p className="eyebrow">Our hiring picture</p>
            <h2>Understand the kinds of opportunity</h2>
          </div>
        </div>
        <ExampleStats
          items={[
            { value: "3", label: "Current vacancies", detail: "Across three role families" },
            { value: "19", label: "Jobs advertised in a year", detail: "Unique advertised opportunities" },
            { value: "£32,000", label: "Median advertised salary", detail: "14 annual salaries" },
            { value: "74%", label: "Adverts publishing pay", detail: "14 of 19 vacancies" },
          ]}
          note="Past 12 months"
        />
        <div className="tpl-feature-grid">
          <div className="tpl-feature-card">
            <h3>What these numbers can tell you</h3>
            <p>
              A hiring history can show the kinds of work an organisation advertises, how frequently
              opportunities appear and how often pay is stated. It is a starting point for understanding the
              employer, not a measure of staff turnover.
            </p>
          </div>
          <div className="tpl-feature-card tpl-feature-card--pink">
            <h3>Advertised pay, in context</h3>
            <p>
              A median is more useful here than an unexplained “average salary”. Role mix, hours and seniority
              matter. Advertised pay does not describe what existing employees earn, and the sample size is
              shown alongside it.
            </p>
          </div>
        </div>
      </section>

      <section className="tpl-wide-section tpl-wide-section--white" id="jobs">
        <div className="shell">
          <div className="tpl-section-heading">
            <div>
              <p className="eyebrow">Make your next move</p>
              <h2>Current jobs at Wildmere</h2>
            </div>
            <span className="tpl-hiring-pill">3 opportunities</span>
          </div>
          <ExampleJobs employer />
        </div>
      </section>
      <div className="shell">
        <TrainingBanner />
        <RelatedGuides guides={relatedGuides} />
      </div>
    </main>
  );
}
