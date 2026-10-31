export type TaxonomyMatchInput = {
  confidence: number;
  evidence: string;
  originalText: string | null;
  termId: number;
};

export type TaxonomyCandidateInput = {
  confidence: number;
  evidence: string;
  originalText: string | null;
  taxonomyType: "benefit" | "occupation";
  title: string;
};

export type StructuredLocationInput = {
  addressLine1: string | null;
  addressLine2: string | null;
  confidence: number;
  countryCode: string | null;
  evidence: string;
  locality: string | null;
  postalCode: string | null;
  precision: "country" | "exact" | "locality" | "postcode" | "region";
  rawText: string;
  region: string | null;
};

export type CanonicalJobLocationInput = {
  countryCode: string | null;
  locality: string | null;
  locationText: string | null;
  postalCode: string | null;
  region: string | null;
};

export type CapabilityCatalogueInput = {
  aliases: readonly string[];
  id: number;
  title: string;
};

export type OccupationCatalogueInput = {
  aliases: readonly string[];
  id: number;
  title: string;
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function exactSourceText(value: string | null, sourceText: string) {
  if (!value) return null;
  const cleaned = compact(value);
  return sourceText.toLocaleLowerCase("en-GB").includes(cleaned.toLocaleLowerCase("en-GB")) ? cleaned : null;
}

function exactPhraseFromSource(phrase: string, sourceText: string) {
  const compactPhrase = compact(phrase);
  if (compactPhrase.length < 8 || compactPhrase.split(" ").length < 2) return null;
  return boundedPhraseFromSource(compactPhrase, sourceText);
}

function boundedPhraseFromSource(phrase: string, sourceText: string) {
  const compactPhrase = compact(phrase);
  const escaped = compactPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const match = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, "iu").exec(sourceText);
  return match?.[1] ?? null;
}

function occupationPhraseFromTitle(phrase: string, sourceTitle: string) {
  const compactPhrase = compact(phrase);
  if (compactPhrase.length < 4) return null;
  const roleTitle = compact(sourceTitle.split(/\s+with\s+/iu, 1)[0]).replace(/\s*\([^)]*\)\s*$/u, "");
  const evidence = boundedPhraseFromSource(compactPhrase, roleTitle);
  if (!evidence) return null;
  if (compactPhrase.includes(" ")) return evidence;
  return roleTitle.toLocaleLowerCase("en-GB").endsWith(evidence.toLocaleLowerCase("en-GB")) ? evidence : null;
}

export function normaliseTaxonomyCandidateTitle(value: string) {
  return compact(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GB")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 160);
}

export function canonicalJobLocationFallback(input: CanonicalJobLocationInput) {
  const rawText = input.locationText ? compact(input.locationText) : "";
  if (!rawText) return null;

  const precision = input.postalCode
    ? "postcode"
    : input.locality
      ? "locality"
      : input.region
        ? "region"
        : input.countryCode
          ? "country"
          : null;
  if (!precision) return null;

  return {
    assignment_source: "deterministic",
    confidence: 95,
    country_code: input.countryCode,
    evidence_text: rawText,
    is_primary: true,
    locality: input.locality,
    policy_version: "canonical-job-location-v1",
    postal_code: input.postalCode,
    precision,
    raw_text: rawText,
    region: input.region,
  } as const;
}

export function selectExactCapabilityMatches(
  capabilities: readonly CapabilityCatalogueInput[],
  sourceText: string,
) {
  return capabilities.flatMap((capability) => {
    const evidence = [capability.title, ...capability.aliases]
      .map((phrase) => exactPhraseFromSource(phrase, sourceText))
      .find((match): match is string => Boolean(match));
    return evidence
      ? [
          {
            capabilityId: capability.id,
            confidence: 98,
            evidence,
            importance: "useful" as const,
            relevanceScore: 85,
          },
        ]
      : [];
  });
}

export function selectExactOccupationMatch(
  occupations: readonly OccupationCatalogueInput[],
  sourceTitle: string | null,
) {
  if (!sourceTitle) return [];
  const matches = occupations.flatMap((occupation) =>
    [occupation.title, ...occupation.aliases].flatMap((phrase) => {
      const evidence = occupationPhraseFromTitle(phrase, sourceTitle);
      return evidence ? [{ confidence: 100, evidence, originalText: evidence, termId: occupation.id }] : [];
    }),
  );
  return matches.sort((left, right) => right.evidence.length - left.evidence.length).slice(0, 1);
}

export function taxonomyClassificationNeedsReview(input: {
  careerAreaMatches: readonly unknown[];
  occupationMatches: readonly unknown[];
}) {
  return input.occupationMatches.length === 0 || input.careerAreaMatches.length === 0;
}

export function selectTaxonomyMatches(
  matches: readonly TaxonomyMatchInput[],
  allowedTermIds: ReadonlySet<number>,
  sourceText: string,
  maximum: number,
) {
  const selected: {
    confidence: number;
    evidence: string;
    originalText: string;
    termId: number;
  }[] = [];
  const seen = new Set<number>();
  for (const match of matches) {
    const evidence = exactSourceText(match.evidence, sourceText);
    if (
      selected.length >= maximum ||
      seen.has(match.termId) ||
      !allowedTermIds.has(match.termId) ||
      match.confidence < 60 ||
      !evidence
    ) {
      continue;
    }
    seen.add(match.termId);
    selected.push({
      confidence: match.confidence,
      evidence,
      originalText: exactSourceText(match.originalText, sourceText) ?? evidence,
      termId: match.termId,
    });
  }
  return selected;
}

export function selectTaxonomyCandidates(candidates: readonly TaxonomyCandidateInput[], sourceText: string) {
  const selected: {
    confidence: number;
    evidence: string;
    normalizedTitle: string;
    originalText: string;
    taxonomyType: "benefit" | "occupation";
    title: string;
  }[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const evidence = exactSourceText(candidate.evidence, sourceText);
    const normalizedTitle = normaliseTaxonomyCandidateTitle(candidate.title);
    const key = `${candidate.taxonomyType}:${normalizedTitle}`;
    if (candidate.confidence < 75 || !evidence || normalizedTitle.length < 2 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    selected.push({
      confidence: candidate.confidence,
      evidence,
      normalizedTitle,
      originalText: exactSourceText(candidate.originalText, sourceText) ?? evidence,
      taxonomyType: candidate.taxonomyType,
      title: compact(candidate.title),
    });
  }
  return selected;
}

export function selectStructuredLocations(locations: readonly StructuredLocationInput[], sourceText: string) {
  const selected: StructuredLocationInput[] = [];
  const seen = new Set<string>();
  for (const location of locations) {
    const evidence = exactSourceText(location.evidence, sourceText);
    const rawText = exactSourceText(location.rawText, sourceText);
    const key = rawText?.toLocaleLowerCase("en-GB") ?? "";
    if (
      selected.length >= 4 ||
      location.confidence < 60 ||
      !evidence ||
      !rawText ||
      seen.has(key) ||
      (location.countryCode && !/^[A-Z]{2}$/.test(location.countryCode))
    ) {
      continue;
    }
    seen.add(key);
    selected.push({ ...location, evidence, rawText });
  }
  return selected;
}
