"use client";

import { useState } from "react";

function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("en-GB");
}

export function EmployerLogo({
  imageClassName,
  logoUrl,
  minimumPixels = 64,
  monogramClassName,
  name,
}: {
  imageClassName: string;
  logoUrl?: string;
  minimumPixels?: number;
  monogramClassName: string;
  name: string;
}) {
  const [rejectedLogoUrl, setRejectedLogoUrl] = useState<string>();
  const imageFailed = rejectedLogoUrl === logoUrl;

  if (!logoUrl || imageFailed) {
    return (
      <div className={monogramClassName} aria-hidden="true">
        {initials(name)}
      </div>
    );
  }

  return (
    <div className={imageClassName}>
      <img
        alt={`${name} logo`}
        onError={() => setRejectedLogoUrl(logoUrl)}
        onLoad={(event) => {
          const image = event.currentTarget;
          if (Math.max(image.naturalWidth, image.naturalHeight) < minimumPixels) {
            setRejectedLogoUrl(logoUrl);
          }
        }}
        src={logoUrl}
      />
    </div>
  );
}
