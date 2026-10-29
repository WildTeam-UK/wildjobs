import type { VacancyFieldEvidence, VacancyFieldName } from "./vacancy-detail-extraction";

export function combineEvidenceChanges(
  deterministic: readonly VacancyFieldEvidence[],
  ai: readonly VacancyFieldEvidence[],
) {
  const changes = new Map<VacancyFieldName, VacancyFieldEvidence>();

  for (const item of [...deterministic, ...ai]) {
    changes.set(item.fieldName, item);
  }

  return [...changes.values()];
}
