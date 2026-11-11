import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

export const PUBLIC_DATA_TAG = "wildjobs-public-data-v1";
export const PUBLIC_DATA_SECONDS = 300;
// Cache pages, not an ever-growing directory or evidence dataset in one item.
export const PUBLIC_DATA_PAGE_SIZE = 200;

export function cachePublicData<Args extends unknown[], Value>(
  key: string,
  load: (...args: Args) => Promise<Value>,
) {
  return unstable_cache(
    load,
    [
      PUBLIC_DATA_TAG,
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "local",
      process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_URL ?? "local",
      key,
    ],
    {
      revalidate: PUBLIC_DATA_SECONDS,
      tags: [PUBLIC_DATA_TAG],
    },
  );
}

export function invalidatePublicData() {
  try {
    // Works in both Server Actions and automation Route Handlers. Withdrawn
    // listings must not get one more stale read after a successful mutation.
    revalidateTag(PUBLIC_DATA_TAG, { expire: 0 });
  } catch {
    // The mutation has committed; a cache failure must not retry imports or AI.
    console.error("Public directory cache invalidation failed; time-based expiry remains active.");
  }
}
