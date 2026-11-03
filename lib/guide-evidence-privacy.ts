// Adverts sometimes print session-bearing application links. Retain the job
// facts, never access credentials embedded in a URL or a copied parameter.
const credentialName =
  "(?:_?dissimulosso|(?:access|refresh|id|session|auth)[_-]?token|token|api[_-]?key|password|secret|signature|x-amz-(?:credential|signature|security-token)|x-goog-(?:credential|signature))";
const credentialParameter = new RegExp(`(?:[?&]|&amp;|%3f|%26)${credentialName}(?:=|%3d)`, "i");
const standaloneParameter = new RegExp(`\\b${credentialName}\\s*(?:=|%3d|:)\\s*[^\\s<>"']+`, "gi");

export function sanitizeGuideEvidenceText(text: string) {
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, (url) =>
      credentialParameter.test(url) ? "[Session-specific application link redacted]" : url,
    )
    .replace(standaloneParameter, "[Credential parameter redacted]");
}
