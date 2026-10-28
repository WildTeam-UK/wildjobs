export type CredentialsValidation =
  | { data: { email: string; password: string }; error?: never }
  | { data?: never; error: "invalid-email" | "password-short" };

export function validateCredentials(formData: FormData): CredentialsValidation {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "invalid-email" };
  }

  if (password.length < 10 || password.length > 128) {
    return { error: "password-short" };
  }

  return { data: { email, password } };
}

export function hasAcceptedTerms(formData: FormData) {
  return formData.get("terms") === "on";
}
