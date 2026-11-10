export function employerLogoVersion(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
export function employerLogoPath(name: string, logoUrl: string) {
  return `/api/employer-logo?name=${encodeURIComponent(name)}&v=${employerLogoVersion(logoUrl)}`;
}
