export const roleMatchingVersion = 1;
export type RoleAlias = Readonly<{ normalized_title: string; role_slug: string | null }>;
export type RoleMatch = Readonly<{
  roleSlug: "ecologist" | null;
  status: "matched" | "review" | "unmatched";
  seniority: "early-career" | "experienced" | "senior" | "mixed" | "unspecified";
  reason: string;
}>;

export function normalizeRoleTitle(title: string) {
  return title
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function seniority(title: string): RoleMatch["seniority"] {
  if (
    /\b(?:all|various|multiple) (?:grades|levels)\b|\b(?:ecologist|consultant|officer|ranger|manager|engineer)\s+(?:senior|principal)\b|\b(?:assistant|graduate|junior|senior|principal)\s+(?:(?:or|and)\s+)?(?:assistant|graduate|junior|senior|principal)\b/.test(
      title,
    )
  )
    return "mixed";
  if (/\b(?:senior|principal|lead|director|head)\b/.test(title)) return "senior";
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
      roleSlug: decision.role_slug === "ecologist" ? "ecologist" : null,
      status: decision.role_slug === "ecologist" ? "matched" : "unmatched",
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
  if (
    normalized
      .split(" ")
      .some((word) => word.length >= 7 && ["ecologist", "ecologists"].some((role) => oneEdit(word, role)))
  )
    return {
      roleSlug: null,
      status: "review",
      seniority: level,
      reason: "Possible spelling variant; confirm before including",
    };
  return {
    roleSlug: null,
    status: "unmatched",
    seniority: level,
    reason: "No supported ecologist occupation",
  };
}
