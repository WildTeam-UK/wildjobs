const internalOrigin = "https://wildjobs.invalid";

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
  values: { error?: string; next?: string; status?: string },
) {
  const searchParams = new URLSearchParams();

  if (values.error) searchParams.set("error", values.error);
  if (values.next) searchParams.set("next", getSafeNextPath(values.next));
  if (values.status) searchParams.set("status", values.status);

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
