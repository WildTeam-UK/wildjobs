export type ExtractedVacancyDetails = {
  contractType?: "apprenticeship" | "fixed_term" | "internship" | "permanent" | "temporary";
  engagementType?: "paid" | "volunteer";
  experienceLevel?: "developing" | "entry" | "experienced" | "leadership" | "open";
  hoursType?: "flexible" | "full_time" | "part_time";
  salaryText?: string;
  workplaceType?: "hybrid" | "on_site" | "remote";
};

export type VacancyFieldName =
  | "application_url"
  | "closes_at"
  | "contract_type"
  | "employer_name"
  | "employer_website_url"
  | "engagement_type"
  | "experience_level"
  | "hours_type"
  | "location_text"
  | "salary_text"
  | "workplace_type";

export type VacancyFieldEvidence = {
  confidence: number;
  evidenceText: string | null;
  extractionMethod: "ai" | "deterministic" | "manual";
  extractorVersion: string;
  fieldName: VacancyFieldName;
  resolutionStatus: "extracted" | "unresolved";
  sourceKind: "document" | "employer_site" | "feed" | "source_page" | "staff";
  value: string | null;
};

type MatchResult = { evidenceText: string; value: string } | undefined;

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function salaryBoundary(value: string) {
  const boundaries = [
    /(?=[.;]\s+(?:permanent|fixed[- ]term|temporary|full[- ]time|part[- ]time|hybrid|remote|on[- ]site)\b)/i,
    /\s+(?=(?:permanent|fixed[- ]term|temporary|full[- ]time|part[- ]time|hybrid|remote|on[- ]site)(?:\s+(?:contract|role|working))?\b)/i,
    /\s+(?=(?:based|contract(?:\s+type)?|working\s+hours?|hours?|location|start\s+date|terms|type)\s*:)/i,
    /(?=(?:Contract(?:\s+Type)?|Working\s+Hours?|Hours?|Location|Start\s+Date|Terms|Type)\s*:)/,
    /(?=Description\b\s*:)/,
    /\s+(?=(?:do you|join\b|we(?:’|')?re|we are|we need)\b)/i,
    /\s+(?=(?:The|This|Our|Help|About)\b)/,
    /\s+(?=(?:hybrid|home[- ]?based|remote)\s+working\b)/i,
    /\s+(?=\d{1,2}(?:\.\d+)?\s+hours?\s+(?:a|per)\b)/i,
  ];
  let end = value.length;

  for (const pattern of boundaries) {
    const index = value.search(pattern);
    if (index >= 0) end = Math.min(end, index);
  }

  return value
    .slice(0, end)
    .trim()
    .replace(/[.;,:]+$/g, "")
    .slice(0, 240);
}

function extractSalary(value: string): MatchResult {
  const labelled = /(?:^|[^a-z])salary(?:\s+details)?\s*(?::|is\s+|will\s+be\s+)/i.exec(value);
  if (labelled) {
    const remainder = value.slice(labelled.index + labelled[0].length).trim();
    const competitive = /^(?:pitched\s+)?competitively?(?:\s+for\s+the\s+right\s+candidate)?/i.exec(
      remainder,
    );
    const salary = competitive?.[0].trim() || salaryBoundary(remainder);
    if (competitive || /£\s?\d/.test(salary)) return { evidenceText: salary, value: salary };
  }

  if (/^(?:(?:circa|from|starting|up to)\s+)?£\s?\d/i.test(value)) {
    const salary = salaryBoundary(value);
    if (salary) return { evidenceText: salary, value: salary };
  }

  return undefined;
}

function firstMatch(value: string, patterns: readonly RegExp[], result: string): MatchResult {
  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (match) return { evidenceText: clean(match[0]), value: result };
  }
  return undefined;
}

function extractContractType(value: string): MatchResult {
  return (
    firstMatch(value, [/\bapprentice(?:ship)?\b/i], "apprenticeship") ??
    firstMatch(value, [/\bintern(?:ship)?\b/i], "internship") ??
    firstMatch(value, [/\b(?:seasonal|temporary)\b/i], "temporary") ??
    firstMatch(
      value,
      [/\bfixed(?:\s|-)?term\b/i, /\bcontract(?:\s+running)?\s+until\b/i, /\b\d{1,2}[- ]month\s+contract\b/i],
      "fixed_term",
    ) ??
    firstMatch(value, [/\bpermanent\b/i], "permanent")
  );
}

function extractHoursType(value: string): MatchResult {
  const fullTime = /\bfull(?:\s|-)?time\b/i.exec(value);
  const partTime = /\bpart(?:\s|-)?time\b/i.exec(value);

  if (fullTime && partTime) {
    return { evidenceText: `${clean(fullTime[0])}; ${clean(partTime[0])}`, value: "flexible" };
  }
  if (partTime) return { evidenceText: clean(partTime[0]), value: "part_time" };
  if (fullTime) return { evidenceText: clean(fullTime[0]), value: "full_time" };
  return firstMatch(value, [/\bflexible\s+hours?\b/i], "flexible");
}

function extractWorkplaceType(value: string): MatchResult {
  return (
    firstMatch(
      value,
      [
        /\bhybrid\s+(?:role|position|job|working|work|arrangement)\b/i,
        /\b(?:work|working)\s+(?:in\s+a\s+)?hybrid\b/i,
      ],
      "hybrid",
    ) ??
    firstMatch(
      value,
      [
        /\bhome[- ]?based\b/i,
        /\b(?:fully\s+)?remote\s+(?:role|position|job|working|work|arrangement)\b/i,
        /\b(?:work|working)\s+remotely\b/i,
      ],
      "remote",
    ) ??
    firstMatch(
      value,
      [
        /\b(?:office[- ]based|site[- ]based)\b/i,
        /\bon[- ]site\s+(?:role|position|job|working|work|arrangement)\b/i,
      ],
      "on_site",
    )
  );
}

function extractExperienceLevel(value: string): MatchResult {
  return (
    firstMatch(value, [/\b(?:all experience levels|no experience required|open to all levels)\b/i], "open") ??
    firstMatch(value, [/\b(?:entry[- ]level|trainee)\b/i], "entry") ??
    firstMatch(value, [/\b(?:early career|graduate|junior)\b/i], "developing") ??
    firstMatch(value, [/\b(?:leadership position|senior leadership)\b/i], "leadership") ??
    firstMatch(
      value,
      [/\b(?:experienced|proven track record|significant experience|substantial experience)\b/i],
      "experienced",
    )
  );
}

function extractEngagementType(value: string): MatchResult {
  const advertisedSalary = extractSalary(value);
  if (advertisedSalary) {
    return { evidenceText: advertisedSalary.evidenceText, value: "paid" };
  }

  return (
    firstMatch(value, [/\bpaid\s+(?:role|position|opportunity)\b/i, /\bsalaried\b/i], "paid") ??
    firstMatch(
      value,
      [
        /\bunpaid\s+(?:role|position|opportunity|post|vacancy)\b/i,
        /\bvolunteer\s+(?:role|position|opportunity|post|vacancy)\b/i,
        /\b(?:role|position|opportunity|post|vacancy)\s+(?:is\s+)?(?:an?\s+)?(?:unpaid|volunteer)\b/i,
      ],
      "volunteer",
    )
  );
}

function evidence(
  fieldName: VacancyFieldName,
  result: MatchResult,
  confidence: number,
): VacancyFieldEvidence {
  return {
    confidence: result ? confidence : 0,
    evidenceText: result?.evidenceText ?? null,
    extractionMethod: "deterministic",
    extractorVersion: "feed-rules-v3",
    fieldName,
    resolutionStatus: result ? "extracted" : "unresolved",
    sourceKind: "feed",
    value: result?.value ?? null,
  };
}

export function extractVacancyFieldEvidence(
  sourceText: string | null,
  options: {
    extractorVersion?: string;
    sourceKind?: VacancyFieldEvidence["sourceKind"];
  } = {},
): VacancyFieldEvidence[] {
  const text = sourceText?.trim() ? clean(sourceText) : "";
  return [
    evidence("contract_type", text ? extractContractType(text) : undefined, 90),
    evidence("engagement_type", text ? extractEngagementType(text) : undefined, 90),
    evidence("experience_level", text ? extractExperienceLevel(text) : undefined, 75),
    evidence("hours_type", text ? extractHoursType(text) : undefined, 90),
    evidence("salary_text", text ? extractSalary(text) : undefined, 95),
    evidence("workplace_type", text ? extractWorkplaceType(text) : undefined, 85),
  ].map((item) => ({
    ...item,
    extractorVersion: options.extractorVersion ?? item.extractorVersion,
    sourceKind: options.sourceKind ?? item.sourceKind,
  }));
}

export function extractVacancyDetails(sourceText: string | null): ExtractedVacancyDetails {
  const values = new Map(
    extractVacancyFieldEvidence(sourceText).map((item) => [item.fieldName, item.value ?? undefined]),
  );

  return {
    contractType: values.get("contract_type") as ExtractedVacancyDetails["contractType"],
    engagementType: values.get("engagement_type") as ExtractedVacancyDetails["engagementType"],
    experienceLevel: values.get("experience_level") as ExtractedVacancyDetails["experienceLevel"],
    hoursType: values.get("hours_type") as ExtractedVacancyDetails["hoursType"],
    salaryText: values.get("salary_text"),
    workplaceType: values.get("workplace_type") as ExtractedVacancyDetails["workplaceType"],
  };
}
