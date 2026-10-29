export type ExtractedVacancyDetails = {
  contractType?: "apprenticeship" | "fixed_term" | "internship" | "permanent" | "temporary";
  experienceLevel?: "developing" | "entry" | "experienced" | "leadership" | "open";
  hoursType?: "flexible" | "full_time" | "part_time";
  salaryText?: string;
  workplaceType?: "hybrid" | "on_site" | "remote";
};

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function salaryBoundary(value: string) {
  const boundaries = [
    /\s+(?=(?:based|contract(?:\s+type)?|hours?|location|start\s+date|terms|type)\s*:)/i,
    /\s+(?=(?:do you|join\b|we(?:’|')?re|we are|we need)\b)/i,
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

function extractSalary(value: string) {
  const labelled = /\bsalary(?:\s+details)?\s*(?::|is\s+|will\s+be\s+)/i.exec(value);
  if (labelled) {
    const remainder = value.slice(labelled.index + labelled[0].length).trim();
    const competitive = /^(?:pitched\s+)?competitively?(?:\s+for\s+the\s+right\s+candidate)?/i.exec(
      remainder,
    );
    if (competitive) return competitive[0].trim();

    const salary = salaryBoundary(remainder);
    return /£\s?\d/.test(salary) ? salary : undefined;
  }

  if (/^(?:(?:circa|from|starting|up to)\s+)?£\s?\d/i.test(value)) {
    return salaryBoundary(value) || undefined;
  }

  return undefined;
}

function extractContractType(value: string): ExtractedVacancyDetails["contractType"] {
  if (/\bapprentice(?:ship)?\b/i.test(value)) return "apprenticeship";
  if (/\bintern(?:ship)?\b/i.test(value)) return "internship";
  if (/\b(?:seasonal|temporary)\b/i.test(value)) return "temporary";
  if (
    /\bfixed(?:\s|-)?term\b/i.test(value) ||
    /\bcontract(?:\s+running)?\s+until\b/i.test(value) ||
    /\b\d{1,2}[- ]month\s+contract\b/i.test(value)
  ) {
    return "fixed_term";
  }
  if (/\bpermanent\b/i.test(value)) return "permanent";
  return undefined;
}

function extractHoursType(value: string): ExtractedVacancyDetails["hoursType"] {
  const fullTime = /\bfull(?:\s|-)?time\b/i.test(value);
  const partTime = /\bpart(?:\s|-)?time\b/i.test(value);

  if (fullTime && partTime) return "flexible";
  if (partTime) return "part_time";
  if (fullTime) return "full_time";
  if (/\bflexible\s+hours?\b/i.test(value)) return "flexible";
  return undefined;
}

function extractWorkplaceType(value: string): ExtractedVacancyDetails["workplaceType"] {
  if (/\bhybrid(?:\s+working)?\b/i.test(value)) return "hybrid";
  if (/\b(?:home[- ]?based|remote(?:\s+working)?)\b/i.test(value)) return "remote";
  if (/\b(?:office[- ]based|on[- ]site|site[- ]based)\b/i.test(value)) return "on_site";
  return undefined;
}

function extractExperienceLevel(value: string): ExtractedVacancyDetails["experienceLevel"] {
  if (/\b(?:all experience levels|no experience required|open to all levels)\b/i.test(value)) return "open";
  if (/\b(?:entry[- ]level|trainee)\b/i.test(value)) return "entry";
  if (/\b(?:early career|graduate|junior)\b/i.test(value)) return "developing";
  if (/\b(?:leadership position|senior leadership)\b/i.test(value)) return "leadership";
  if (/\b(?:experienced|proven track record|significant experience|substantial experience)\b/i.test(value)) {
    return "experienced";
  }
  return undefined;
}

export function extractVacancyDetails(sourceText: string | null): ExtractedVacancyDetails {
  if (!sourceText?.trim()) return {};
  const text = clean(sourceText);

  return {
    contractType: extractContractType(text),
    experienceLevel: extractExperienceLevel(text),
    hoursType: extractHoursType(text),
    salaryText: extractSalary(text),
    workplaceType: extractWorkplaceType(text),
  };
}
