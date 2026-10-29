"use client";

import { useEffect, useRef, useState } from "react";

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
  monogramClassName,
  name,
}: {
  imageClassName: string;
  logoUrl?: string;
  monogramClassName: string;
  name: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setImageFailed(true);
  }, [logoUrl]);

  if (!logoUrl || imageFailed) {
    return (
      <div className={monogramClassName} aria-hidden="true">
        {initials(name)}
      </div>
    );
  }

  return (
    <div className={imageClassName}>
      <img alt={`${name} logo`} onError={() => setImageFailed(true)} ref={imageRef} src={logoUrl} />
    </div>
  );
}
