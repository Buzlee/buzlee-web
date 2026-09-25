/**
 * OAuth/PKCE code exchange for the /admin dashboard session.
 *
 * Deliberately distinct from /auth/callback (the native-app deep-link
 * hand-off page) — do not merge the two.
 */
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/shared/lib/supabase";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const signInUrl = new URL("/admin/sign-in", url.origin);
      signInUrl.searchParams.set("error", "auth");
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.redirect(new URL("/admin", url.origin));
}
