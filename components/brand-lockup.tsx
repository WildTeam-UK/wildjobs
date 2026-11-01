import { BrandWordmark } from "@wildteam-uk/ui";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={["brand-lockup", className].filter(Boolean).join(" ")}>
      <span className="brand-lockup__mark" aria-hidden="true" />
      <BrandWordmark className="brand-lockup__wordmark" product="TEAM" aria-hidden="true" />
    </span>
  );
}
