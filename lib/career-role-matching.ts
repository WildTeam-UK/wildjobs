import {
  careerRoleLabels,
  careerRoleSlugs,
  isCareerRoleSlug,
  type CareerRoleSlug,
} from "./career-role-catalog";
export const roleMatchingVersion = 2;
export type RoleAlias = Readonly<{ normalized_title: string; role_slug: string | null }>;
export type RoleMatch = Readonly<{
  roleSlug: CareerRoleSlug | null;
  status: "matched" | "review" | "unmatched";
  seniority: "early-career" | "experienced" | "senior" | "mixed" | "unspecified";
  reason: string;
}>;

export function normalizeRoleTitle(title: string) {
  return title
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function seniority(title: string): RoleMatch["seniority"] {
  if (
    /\b(?:all|various|multiple) (?:grades|levels)\b|\b(?:ecologist|consultant|officer|ranger|manager|engineer|biologist)\s+(?:senior|principal)\b|\b(?:assistant|graduate|junior|senior|principal)\s+(?:(?:or|and)\s+)?(?:assistant|graduate|junior|senior|principal)\b|\b(?:i|ii|iii)\s+(?:(?:or|and)\s+)?(?:ii|iii)\b/.test(
      title,
    )
  )
    return "mixed";
  if (/\b(?:senior|principal|lead|director|head|chief|ceo)\b/.test(title)) return "senior";
  if (/\b(?:assistant|graduate|trainee|apprentice|junior)\b/.test(title)) return "early-career";
  return "unspecified";
}

// Only a single spelling edit of a long, complete occupation word is eligible for review.
function oneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a[i] === b[j + 1] && a[i + 1] === b[j]) {
      i += 2;
      j += 2;
    } else if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + Number(i < a.length || j < b.length) <= 1;
}

export function matchCareerRole(
  title: string,
  description = "",
  aliases: readonly RoleAlias[] = [],
): RoleMatch {
  const normalized = normalizeRoleTitle(title);
  const level = seniority(normalized);
  const decision = aliases.find((a) => a.normalized_title === normalized);
  if (decision)
    return {
      roleSlug: decision.role_slug && isCareerRoleSlug(decision.role_slug) ? decision.role_slug : null,
      status: decision.role_slug && isCareerRoleSlug(decision.role_slug) ? "matched" : "unmatched",
      seniority: level,
      reason: "Staff-reviewed title mapping",
    };
  // Department names and a passing mention of ecology are not occupation matches.
  if (/\b(?:ecologist|ecologists)\b/.test(normalized)) {
    if (
      /\b(?:ranger|officer|manager|engineer|recruiter|recruitment|secretary|administrator)\b|\bassistant to\b/.test(
        normalized,
      )
    )
      return {
        roleSlug: null,
        status: "review",
        seniority: level,
        reason: "Advert may cover more than one occupation",
      };
    return {
      roleSlug: "ecologist",
      status: "matched",
      seniority: level,
      reason: "Explicit ecologist occupation in the original title",
    };
  }
  if (/\b(?:ecological consultants?|ecology consultants?)\b/.test(normalized)) {
    const supported = /\b(?:surveys?|habitats?|species|ecological assessments?|ecological reports?)\b/i.test(
      description,
    );
    return {
      roleSlug: supported ? "ecologist" : null,
      status: supported ? "matched" : "review",
      seniority: level,
      reason: supported
        ? "Ecological consultant title supported by advertised duties"
        : "Consultant title needs supporting duties",
    };
  }
  const families: { slug: CareerRoleSlug; pattern: RegExp }[] = [
    { slug: "project-manager", pattern: /\bproject managers?\b/ },
    { slug: "project-officer", pattern: /\bproject officers?\b/ },
    {
      slug: "environmental-educator",
      pattern:
        /\b(?:environmental(?: science| program)?|conservation) educators?\b|\beducation(?: and community engagement| and engagement)? officers?\b|\boutdoor education(?: field study)? instructors?\b/,
    },
    { slug: "biologist", pattern: /\bbiologists?\b/ },
    { slug: "chief-executive", pattern: /\bchief executive(?: officer)?\b|\bexecutive directors?\b|\bceo\b/ },
  ];
  const matches = families.filter((family) => family.pattern.test(normalized));
  if (matches.length) {
    const family = matches[0];
    const mixed =
      matches.length > 1 ||
      /\bassistant to\b|\bexecutive assistant\b|\b(?:recruiter|recruitment|secretary|regulatory specialist|field supervisor)\b/.test(
        normalized,
      );
    // A department is not an occupation. Ecology project officers remain a
    // review case rather than being silently reclassified from the pilot.
    const needsReview = mixed || (family.slug === "project-officer" && /\becology\b/.test(normalized));
    const relatedRole =
      (family.slug === "chief-executive" &&
        /\b(?:non executive|personal assistant|office manager)\b|\bexecutive directors? (?:of|for)\b/.test(
          normalized,
        )) ||
      (family.slug === "biologist" && /\btechnician\b/.test(normalized));
    return {
      roleSlug: needsReview || relatedRole ? null : family.slug,
      status: needsReview || relatedRole ? "review" : "matched",
      seniority: level,
      reason:
        needsReview || relatedRole
          ? "Occupation or combined responsibilities need review"
          : "Explicit occupation family in the original title",
    };
  }
  if (
    /\bproject leads?\b|\bproject co ?ordinators?\b/.test(normalized) ||
    careerRoleSlugs.some((slug) => {
      const target = careerRoleLabels[slug].toLowerCase();
      const words = normalized.split(" "),
        size = target.split(" ").length;
      return words.some((_, i) => oneEdit(words.slice(i, i + size).join(" "), target));
    }) ||
    normalized
      .split(" ")
      .some(
        (word) =>
          word.length >= 7 &&
          ["ecologist", "ecologists", "biologist", "biologists", "educator", "educators"].some((role) =>
            oneEdit(word, role),
          ),
      )
  )
    return {
      roleSlug: null,
      status: "review",
      seniority: level,
      reason: "Related title or possible spelling variant; confirm before including",
    };
  return {
    roleSlug: null,
    status: "unmatched",
    seniority: level,
    reason: "No supported occupation family",
  };
}
