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
 * Service-role client: bypasses RLS. Use for all DB operations on the server.
 * Never expose to the client.
 *
 * Reads are FRESH by default. postgrest-js calls the ambient `fetch` with no
 * cache option, and Next 14 caches such a fetch in its Data Cache unless the
 * request has already touched cookies or headers. `dynamic = "force-dynamic"`
 * does not prevent it, in pages or in Route Handlers. That silently froze
 * live-session data: the live page stayed on its pre-event view after the
 * status changed, attendance counts stopped moving, and a revoked control
 * link kept reading as valid. So every query is sent with `cache: "no-store"`
 * unless the caller opts in.
 *
 * Pass `{ revalidate: seconds }` ONLY from statically generated (ISR) pages,
 * using the page's own `revalidate` value. A no-store fetch inside one of
 * those turns the page dynamic at runtime, which Next reports as a 500.
 *
 * `noStore` is accepted for older call sites and is now the default.
 */
export function createAdminClient(options?: { noStore?: boolean; revalidate?: number }) {
  const revalidate = options?.noStore ? undefined : options?.revalidate;
  const cachedFetch = (url: RequestInfo | URL, init?: RequestInit) =>
    revalidate === undefined
      ? fetch(url, { ...init, cache: "no-store" })
      : fetch(url, { ...init, next: { revalidate } } as RequestInit);

  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: cachedFetch },
    }
  );
}
