const internalOrigin = "https://wildjobs.invalid";
const jobSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getSafeJobSlug(value: unknown) {
  return typeof value === "string" && value.length <= 160 && jobSlugPattern.test(value) ? value : null;
}

export function getSafeNextPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, internalOrigin);

    if (url.origin !== internalOrigin) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildAuthPath(
  pathname: "/create-account" | "/sign-in",
  values: { error?: string; intent?: "save"; job?: string; next?: string; status?: string },
) {
  const searchParams = new URLSearchParams();

  if (values.error) searchParams.set("error", values.error);
  if (values.intent === "save" && getSafeJobSlug(values.job)) {
    searchParams.set("intent", values.intent);
    searchParams.set("job", values.job as string);
  }
  if (values.next) searchParams.set("next", getSafeNextPath(values.next));
  if (values.status) searchParams.set("status", values.status);

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
