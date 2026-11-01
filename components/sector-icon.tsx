export function SectorIcon({ title }: { title: string }) {
  const paths = /Climate|Carbon|Energy/.test(title) ? (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
    </>
  ) : /Marine/.test(title) ? (
    <>
      <path d="M3 12c5-7 10-7 15 0-5 7-10 7-15 0Zm15 0 4-4v8Z" />
      <circle cx="8" cy="11" r=".6" />
    </>
  ) : /Rivers|Water/.test(title) ? (
    <>
      <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />
      <path d="M8 16c0 2 2 3 4 3" />
    </>
  ) : /Education/.test(title) ? (
    <>
      <path d="m2 7 10-4 10 4-10 4ZM6 9v7c4 3 8 3 12 0V9M22 7v8" />
    </>
  ) : /Transport/.test(title) ? (
    <>
      <circle cx="5" cy="17" r="4" />
      <circle cx="19" cy="17" r="4" />
      <path d="m5 17 5-9 5 9H5m5-9 9 9M8 5h5m4-2h3l2 5" />
    </>
  ) : /Policy/.test(title) ? (
    <>
      <path d="m3 9 15-5v16L3 15ZM18 9h3v6h-3M5 16l2 6h4l-2-5" />
    </>
  ) : /Food|Farming/.test(title) ? (
    <>
      <path d="M12 22V3M12 8C5 8 5 3 5 3s7 0 7 5Zm0 6c7 0 7-5 7-5s-7 0-7 5Zm0 5c-7 0-7-5-7-5s7 0 7 5Z" />
    </>
  ) : /Management/.test(title) ? (
    <>
      <rect x="5" y="4" width="14" height="18" rx="2" />
      <path d="M9 2h6v4H9Zm0 10 2 2 4-4M9 18h6" />
    </>
  ) : /Sustainability/.test(title) ? (
    <>
      <path d="m8 5 3-3 4 6m4 2 4 2-5 7m-5 2-4 2-5-8M8 5H4v4m15 1-2 4 5 1m-9 6 2-4-5-1" />
    </>
  ) : /Ecology/.test(title) ? (
    <>
      <path d="M12 22V11M12 14C2 14 2 5 2 5s10-1 10 9Zm0-4C22 10 22 2 22 2S12 1 12 10Z" />
    </>
  ) : (
    <>
      <path d="M12 20C5 20 3 14 4 10c4-1 8 1 8 5 0-4 4-6 8-5 1 4-1 10-8 10ZM12 20V8M9 4l3 4 3-4" />
    </>
  );
  return (
    <svg className="job-filter-menu__sector-icon" aria-hidden="true" viewBox="0 0 24 24">
      {paths}
    </svg>
  );
}
