type EmployerProfileInput = {
  mission: string;
  overview: string;
  websiteUrl: string;
};

export type EmployerProfileValidation =
  | { data: EmployerProfileInput; error?: never }
  | { data?: never; error: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEmployerProfile(formData: FormData): EmployerProfileValidation {
  const websiteUrl = textValue(formData, "websiteUrl");
  const mission = textValue(formData, "mission");
  const overview = textValue(formData, "overview");

  if (!isHttpsUrl(websiteUrl)) return { error: "Enter the employer’s HTTPS website." };
  if (mission.length < 20 || mission.length > 400) {
    return { error: "Add a concise employer mission between 20 and 400 characters." };
  }
  if (overview.length < 40 || overview.length > 1_200) {
    return { error: "Add an employer overview between 40 and 1,200 characters." };
  }

  return { data: { mission, overview, websiteUrl } };
}
