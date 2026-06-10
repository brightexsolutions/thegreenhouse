import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Allow login page — set x-pathname so admin layout can detect it
  if (pathname === "/admin/login") {
    const res = NextResponse.next({ request });
    res.headers.set("x-pathname", pathname);
    return res;
  }

  // Build a response we can mutate cookies on
  let response = NextResponse.next({ request });
  response.headers.set("x-pathname", pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Super-admin-only routes
  if (pathname.startsWith("/admin/system")) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
