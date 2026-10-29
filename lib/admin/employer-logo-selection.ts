export function looksLikeFavicon(value: string | null) {
  return Boolean(value && /(?:favicon|apple-touch-icon|icon[-_.]?\d*)/i.test(value));
}

type EmployerLogoSelectionInput = {
  candidateLogoSourceUrl: string | null;
  candidateLogoUrl: string | null;
  existingLogoSourceUrl: string | null;
  existingLogoUrl: string | null;
};

export function selectEmployerLogo(input: EmployerLogoSelectionInput) {
  const candidateIsVerifiable = Boolean(input.candidateLogoUrl && input.candidateLogoSourceUrl);
  const candidateCompletesExistingPair = Boolean(
    input.candidateLogoUrl === input.existingLogoUrl && !input.existingLogoSourceUrl,
  );
  const candidateImprovesExistingLogo = Boolean(
    looksLikeFavicon(input.existingLogoUrl) && !looksLikeFavicon(input.candidateLogoUrl),
  );
  const useCandidate = Boolean(
    candidateIsVerifiable &&
    (!input.existingLogoUrl || candidateCompletesExistingPair || candidateImprovesExistingLogo),
  );

  return {
    logoSourceUrl: useCandidate ? input.candidateLogoSourceUrl : input.existingLogoSourceUrl,
    logoUrl: useCandidate ? input.candidateLogoUrl : input.existingLogoUrl,
  };
}
