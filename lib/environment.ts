export function environmentValue(value: string | undefined) {
  return value?.trim() ?? "";
}

export function requireEnvironmentValue(name: string, value: string | undefined) {
  const resolved = environmentValue(value);
  if (!resolved) throw new Error(`Missing required environment variable: ${name}`);
  return resolved;
}
