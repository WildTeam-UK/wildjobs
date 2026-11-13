# Function storage and bundle sizes

## Why WildJobs differs from WildNews

WildJobs uses Next.js and the Vercel Next.js builder. Its public pages, staff
actions, automation routes, logo endpoint, authentication callback, sharing-image
fallback and middleware have different execution requirements. The builder can
share one archive between several route entries: the 13 November 2026 local build
produced eight distinct function archives, with multiple HTML/RSC routes pointing
to the same archive. Counting dashboard route rows overstates the number of
distinct archives.

WildNews uses Vinext/Vite/Nitro with `noExternals: true` and produces one bundled
server function. WildJobs additionally needs Sharp and native libvips binaries for
safe logo processing and sharing images, and unpdf for recruitment-document text
extraction. These dependencies must remain available in the functions that use
them. The size difference is primarily packaging and these runtime requirements,
not the number of job records in Supabase.

Retained deployment count multiplies the stored output. The separate seven-day
retention policy remains useful even when the function archives are smaller.

## Reductions implemented on 13 November 2026

- Course updates and logo updates have their own Server Action modules. Importing
  a course form no longer imports the full feed/PDF processing module. Staff checks,
  input validation, image safety checks and cache invalidation are preserved.
- The admin layout applies the existing 150-second staff-processing budget to the
  entire workspace. Previously some staff pages inherited the public-page default,
  causing their native image dependencies to enter the shared public-page archive.
  The existing 150-second processing pages retain their limits; the remaining staff
  pages now use 150 seconds as well. Automation and the public logo endpoint retain
  their own existing limits. The builder now keeps native image and PDF libraries
  out of the public-page archive.
- Guide sharing-image reads are constrained to the catalogue's `design` and
  `sectors` image collections. A computed read beneath all of `public/` previously
  made the file tracer include unrelated course experiments, employer photos and
  other public assets in the fallback function. These files are still served as
  static assets. New guide images must use one of those two collections or extend
  the reader deliberately.

## Measurements

Same source baseline (`63f2627`), dependencies, machine and Vercel Next.js builder
(`@vercel/next` supplied by Vercel CLI 65.2.0), with local packaging only. Archives
were measured with the builder's `Lambda.createZip()`, counting each shared Lambda
object once. No deployment or production setting change was made for this work.

| Local archive measurement                          |    Before |     After | Reduction |
| -------------------------------------------------- | --------: | --------: | --------: |
| Public-page group, zipped                          |  11.26 MB |   1.37 MB |     87.8% |
| Guide sharing-image fallback group, zipped         |  26.56 MB |  16.45 MB |     38.1% |
| All eight distinct function archives, zipped       |  80.37 MB |  60.50 MB |     24.7% |
| All eight distinct function archives, uncompressed | 172.26 MB | 139.08 MB |     19.3% |

MB above means decimal bytes. This macOS build includes macOS native binaries;
Vercel uses Linux binaries, so the exact deployed sizes and billing savings need
post-deployment confirmation. The reductions do not remove storage from old
deployments, eliminate growth from new deployments, or refund recorded GB-months.

## Verification and repeatable inspection

Run the normal type, lint, unit-test and production-build checks. The unit tests
exercise logo decoding/sanitisation, PDF text extraction, source HTTP protections
and staff-only mutations. Compare hashes of the generated guide/share image bodies
when changing their asset reads; all 19 generated images were identical here.

Validation completed for this change: formatting, typecheck, lint, 461 unit tests
(two opt-in database tests skipped), the production build and the synthetic
production-server exercise all passed. The extracted public function archive also
served the homepage, employer directory and careers hub with synthetic data. The
extracted logo archive decoded a synthetic SVG to a valid PNG using only its
packaged native libraries. These archive checks made no production requests.

After `pnpm build`, run:

```sh
pnpm analyze:functions > /tmp/wildjobs-function-traces.json
```

This reports uncompressed Next.js file traces, the largest files and native/PDF
dependencies per route. It does not call services, rebuild or print environment
values. Shared files repeat in route traces, so do not treat their sum as a
deployment-storage or billing measurement. For actual archive comparisons, inspect
the Vercel build output and deduplicate routes that share a function; compare
Linux builds on the same builder version.

The synthetic production-server exercise in `scripts/verify-public-egress.mjs`
also checks public rendering, warm cache reads, automation authentication and
invalidation after successful/partial imports without contacting production.
It inlines fixture values into the build, so rebuild normally afterwards.
