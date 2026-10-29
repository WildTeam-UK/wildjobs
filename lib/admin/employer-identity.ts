type EmployerIdentity = {
  name: string | null;
  websiteUrl: string | null;
};

const NAME_STOP_WORDS = new Set(["and", "for", "of", "the"]);
const SHARED_WEBSITE_HOSTS = new Set(["gov.uk"]);

function normaliseName(value: string | null) {
  return (
    value
      ?.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-GB")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim() ?? ""
  );
}

function nameAcronym(value: string) {
  return value
    .split(" ")
    .filter((word) => word && !NAME_STOP_WORDS.has(word))
    .map((word) => word[0])
    .join("");
}

export function employerNamesMatch(left: string | null, right: string | null) {
  const normalisedLeft = normaliseName(left);
  const normalisedRight = normaliseName(right);
  if (!normalisedLeft || !normalisedRight) return false;
  if (normalisedLeft === normalisedRight) return true;

  const compactLeft = normalisedLeft.replace(/\s/g, "");
  const compactRight = normalisedRight.replace(/\s/g, "");
  const leftAcronym = nameAcronym(normalisedLeft);
  const rightAcronym = nameAcronym(normalisedRight);
  return (
    (compactLeft.length >= 2 && compactLeft === rightAcronym) ||
    (compactRight.length >= 2 && compactRight === leftAcronym)
  );
}

function parsedWebsite(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLocaleLowerCase("en-GB");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return { host, path };
  } catch {
    return null;
  }
}

function sharedWebsiteIdentity(host: string, path: string) {
  if (host === "gov.uk") {
    const organisation = path.match(/^\/government\/organisations\/([^/]+)/);
    if (organisation) return `${host}/government/organisations/${organisation[1]}`;
  }
  return `${host}${path}`;
}

export function employerWebsitesMatch(left: string | null, right: string | null) {
  const parsedLeft = parsedWebsite(left);
  const parsedRight = parsedWebsite(right);
  if (!parsedLeft || !parsedRight || parsedLeft.host !== parsedRight.host) return false;
  if (!SHARED_WEBSITE_HOSTS.has(parsedLeft.host)) return true;
  return (
    sharedWebsiteIdentity(parsedLeft.host, parsedLeft.path) ===
    sharedWebsiteIdentity(parsedRight.host, parsedRight.path)
  );
}

export function employerIdentityConflicts(source: EmployerIdentity, candidate: EmployerIdentity) {
  const sourceName = normaliseName(source.name);
  const candidateName = normaliseName(candidate.name);
  if (sourceName && candidateName && !employerNamesMatch(source.name, candidate.name)) return true;

  const sourceWebsite = parsedWebsite(source.websiteUrl);
  const candidateWebsite = parsedWebsite(candidate.websiteUrl);
  return Boolean(
    sourceWebsite && candidateWebsite && !employerWebsitesMatch(source.websiteUrl, candidate.websiteUrl),
  );
}

export function employerIdentityMatches(source: EmployerIdentity, candidate: EmployerIdentity) {
  if (employerIdentityConflicts(source, candidate)) return false;
  return (
    employerNamesMatch(source.name, candidate.name) ||
    employerWebsitesMatch(source.websiteUrl, candidate.websiteUrl)
  );
}
