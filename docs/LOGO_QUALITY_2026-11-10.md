# Employer logo visibility

Taronga's stored recruitment-platform SVG drew every path in `#FFFFFE`, making it invisible on white job cards. The organisation record was updated from that SVG to the green Taronga Conservation Society logo linked from its official homepage (`https://www.taronga.org.au/globalassets/logo-tcs.png`). The update compared the previous URL before writing and was verified afterward.

Shared checks now decode actual image pixels, composite transparency against white and require visible detail. Empty, all-white, transparent-only, uniform placeholders, unreadable and undersized images are rejected. White lettering on a dark branded background remains valid. SVG resources are restricted before rasterisation, with bounded input size, decoded dimensions and processing time. Sharp 0.35.5 was already in the Next.js lockfile and is now an explicitly pinned application dependency.

The same validation applies to feed/adverts, discovered website branding, cached icons, existing branding reused by enrichment and staff logo updates. The feed worker limits logo-check concurrency and work per run; unavailable branding never stops a vacancy from publishing. Verified employer research can repair an invalid stored logo as well as a missing one, preserves valid administrator choices and uses a conditional update to avoid races.

All public EmployerLogo instances request a checked PNG for the stored organisation branding. The endpoint accepts an employer name and source version, not an arbitrary image URL. It uses the existing public read policy, safe DNS-pinned fetching, bounded rasterisation and a one-hour cache. Changing a stored URL changes the image URL immediately. Missing, invalid or temporarily unavailable images trigger the existing initials fallback, instead of leaving an invisible image. External logo changes are rechecked after cache expiry. This protects legacy branding too, including logos not yet revisited by enrichment.

Regression coverage includes near-white SVGs, transparent and white rasters, real contrasting branding, unsafe SVG resources, blank-logo fallback responses, arbitrary URL rejection, transient failures, preserving valid branding and conditional repair.

GitHub Desktop summary: **Fix Taronga logo and reject invisible employer branding**

Description: Replace Taronga's white recruitment logo with official green branding, validate imported and saved logos using image pixels, and serve checked logo snapshots with an initials fallback. No database schema change or new service is required.
