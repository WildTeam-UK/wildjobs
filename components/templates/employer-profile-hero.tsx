import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { EditorialImageCredit } from "@/components/editorial-image-credit";
import { EmployerLogo } from "@/components/employer-logo";
import { LeafMark, Sparkle } from "@/components/templates/template-parts";
import { guideSectorLabels, type SectorGuideSlug } from "@/lib/guide-sectors";

type ProfilePhoto = {
  image: StaticImageData | string;
  imageAlt: string;
  creatorName: string;
  creatorUrl?: string;
  sourceUrl: string;
  objectPosition?: string;
};

export function EmployerProfileHero({
  name,
  website,
  logo,
  photo,
  roles,
  categories,
  sample = false,
}: {
  name: string;
  website: string | null;
  logo?: string | null;
  photo?: ProfilePhoto;
  roles: number;
  categories: readonly SectorGuideSlug[];
  sample?: boolean;
}) {
  return (
    <div className="shell tpl-employer-cover">
      {photo ? (
        <figure className="tpl-photo">
          <Image
            src={photo.image}
            alt={photo.imageAlt}
            width={typeof photo.image === "string" ? 1400 : undefined}
            height={typeof photo.image === "string" ? 900 : undefined}
            sizes="(max-width: 1240px) 100vw, 1240px"
            style={photo.objectPosition ? { objectPosition: photo.objectPosition } : undefined}
            preload
          />
          <EditorialImageCredit
            creatorName={photo.creatorName}
            creatorUrl={photo.creatorUrl}
            sourceUrl={photo.sourceUrl}
          />
        </figure>
      ) : null}
      <header className="tpl-employer-heading">
        {sample ? (
          <LeafMark />
        ) : (
          <EmployerLogo
            name={name}
            logoUrl={logo ?? undefined}
            imageClassName="tpl-employer-logo"
            monogramClassName="tpl-employer-logo tpl-employer-logo--monogram"
          />
        )}
        <div className="tpl-employer-heading__copy">
          <div className="tpl-employer-heading__title">
            <h1>{name}</h1>
            {website ? (
              <a
                className="tpl-text-link tpl-employer-website"
                href={website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website
              </a>
            ) : null}
          </div>
          <ul className="tpl-employer-pills" aria-label="Hiring status and role categories">
            <li>
              {roles ? (
                <span className="tpl-employer-pill tpl-hiring-pill tpl-hiring-pill--fancy">
                  <Sparkle />
                  <span>
                    Hiring now · {roles} {roles === 1 ? "role" : "roles"}
                  </span>
                </span>
              ) : (
                <span className="tpl-employer-pill tpl-employer-pill--idle">No current vacancies</span>
              )}
            </li>
            {categories.map((category) => (
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
        </div>
      </header>
    </div>
  );
}
