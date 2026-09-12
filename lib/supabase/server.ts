import { createServerClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Auth-aware SSR client — reads user session from cookies. Use for auth checks only. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Use for all DB operations in API routes.
 * Never expose to client.
 *
 * `noStore: true` makes every query from this client bypass Next.js's fetch
 * Data Cache. postgrest-js just calls the ambient `fetch` with no `cache`
 * option, so on Server Components (not Route Handlers) that fetch can still
 * get cached even when the page sets `dynamic = "force-dynamic"` — this is
 * what let the check-in page keep comparing against a stale checkin_token
 * after it had been regenerated. Route Handlers don't need this: they read
 * fresh by default. Not applied everywhere by default because the blog
 * relies on this client's queries being cacheable for its static pages.
 */
export function createAdminClient(options?: { noStore?: boolean }) {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      ...(options?.noStore
        ? { global: { fetch: (url: RequestInfo | URL, init?: RequestInit) => fetch(url, { ...init, cache: "no-store" }) } }
        : {}),
    }
  );
}
