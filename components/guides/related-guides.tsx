import Link from "next/link";
import { guidePath, type GuideContent } from "@/lib/guide-content";
import { guideName } from "@/lib/guide-seo";
import styles from "./related-guides.module.css";

export function RelatedGuides({ guides }: { guides: readonly GuideContent[] }) {
  if (!guides.length) return null;

  return (
    <section className={styles.section} aria-label="Related guides">
      <h2>Related guides</h2>
      <ul className={styles.grid}>
        {guides.slice(0, 3).map((guide) => (
          <li key={guide.slug}>
            <Link className={styles.card} href={guidePath(guide)}>
              <p className="eyebrow">{guide.kind === "career" ? "Career guide" : "Sector guide"}</p>
              <h3>{guideName(guide)}</h3>
              <p className={styles.description}>{guide.description}</p>
              <span className={styles.action} aria-hidden="true">
                Read the guide <span>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
