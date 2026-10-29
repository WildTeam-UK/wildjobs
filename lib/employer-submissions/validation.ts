const inviteTokenPattern = /^[A-Za-z0-9_-]{43}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const workplaceTypes = new Set(["remote", "hybrid", "on_site"]);

export type EmployerSubmissionInput = Readonly<{
  applicationUrl: string;
  authorityConfirmed: true;
  closingDate: string;
  contactEmail: string;
  contactName: string;
  locationText: string;
  organisationName: string;
  roleSummary: string;
  roleTitle: string;
  salaryText: string;
  token: string;
  website: string;
  workplaceType: "remote" | "hybrid" | "on_site";
}>;

type ValidationResult = { data: EmployerSubmissionInput; error?: never } | { data?: never; error: string };

function textField(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) return { error: `Enter ${label}.` } as const;
  const text = value.trim();
  if (text.length > maxLength) return { error: `${label} is too long.` } as const;
  return { text } as const;
}

function isRealIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateEmployerSubmission(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "The submission could not be read. Please try again." };
  }

  const input = value as Record<string, unknown>;
  if (typeof input.token !== "string" || !inviteTokenPattern.test(input.token)) {
    return { error: "This invitation link is unavailable." };
  }

  const contactName = textField(input.contactName, "your name", 120);
  if (contactName.error) return { error: contactName.error };

  const organisationName = textField(input.organisationName, "the organisation name", 200);
  if (organisationName.error) return { error: organisationName.error };

  const roleTitle = textField(input.roleTitle, "the role title", 200);
  if (roleTitle.error) return { error: roleTitle.error };

  const salaryText = textField(input.salaryText, "the salary or salary range", 200);
  if (salaryText.error) return { error: salaryText.error };

  const locationText = textField(input.locationText, "the location", 200);
  if (locationText.error) return { error: locationText.error };

  const roleSummary = textField(input.roleSummary, "a short role summary", 5_000);
  if (roleSummary.error) return { error: roleSummary.error };

  if (typeof input.contactEmail !== "string") return { error: "Enter a valid work email address." };
  const contactEmail = input.contactEmail.trim().toLocaleLowerCase("en-GB");
  if (!emailPattern.test(contactEmail) || contactEmail.length > 254) {
    return { error: "Enter a valid work email address." };
  }

  if (typeof input.closingDate !== "string" || !isRealIsoDate(input.closingDate)) {
    return { error: "Enter a valid closing date." };
  }
  if (input.closingDate < new Date().toISOString().slice(0, 10)) {
    return { error: "The closing date cannot be in the past." };
  }

  if (typeof input.workplaceType !== "string" || !workplaceTypes.has(input.workplaceType)) {
    return { error: "Choose a valid working pattern." };
  }

  if (typeof input.applicationUrl !== "string" || input.applicationUrl.length > 2_048) {
    return { error: "Enter a valid HTTPS application page URL." };
  }
  let applicationUrl: URL;
  try {
    applicationUrl = new URL(input.applicationUrl);
  } catch {
    return { error: "Enter a valid HTTPS application page URL." };
  }
  if (applicationUrl.protocol !== "https:" || applicationUrl.username || applicationUrl.password) {
    return { error: "Enter a valid HTTPS application page URL." };
  }

  if (input.authorityConfirmed !== true) {
    return { error: "Confirm that you are authorised to share this vacancy." };
  }

  return {
    data: {
      applicationUrl: applicationUrl.toString(),
      authorityConfirmed: true,
      closingDate: input.closingDate,
      contactEmail,
      contactName: contactName.text,
      locationText: locationText.text,
      organisationName: organisationName.text,
      roleSummary: roleSummary.text,
      roleTitle: roleTitle.text,
      salaryText: salaryText.text,
      token: input.token,
      website: typeof input.website === "string" ? input.website : "",
      workplaceType: input.workplaceType as EmployerSubmissionInput["workplaceType"],
    },
  };
}
