/**
 * Next 16 proxy (middleware) for the /admin dashboard only.
 *
 * - Kill switch: when Supabase env vars are absent (production), every
 *   /admin request 404s — the dashboard is intentionally inert there.
 * - Session refresh: re-issues expired Supabase auth cookies on each
 *   /admin request (@supabase/ssr middleware pattern).
 * - Auth gate: unauthenticated requests are sent to /admin/sign-in.
 *   Role enforcement (profiles.role === 'admin') happens in the
 *   /admin/(dashboard) layout + RLS; the proxy only checks for a user.
 *
 * The matcher guarantees non-/admin routes are never touched.
 */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/shared/lib/supabase";
import type { Database } from "@/types/database";

const SIGN_IN_PATH = "/admin/sign-in";
const AUTH_CALLBACK_PATH = "/admin/auth/callback";

export default async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    // Rewrite to a route that does not exist so Next renders its standard
    // 404 page — /admin is inert wherever Supabase env vars are unset.
    const url = request.nextUrl.clone();
    url.pathname = "/admin-not-found";
    return NextResponse.rewrite(url, { status: 404 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates the JWT against Supabase Auth (never trust getSession
  // in server code) and triggers the cookie refresh above when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname === SIGN_IN_PATH || pathname === AUTH_CALLBACK_PATH;

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
