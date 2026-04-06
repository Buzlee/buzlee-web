import { NextResponse } from "next/server";

import { buildNativeOpenUrl } from "@/shared/lib/native-deeplink";

/**
 * Transactional email links hit `/open?path=…`. Mirror Supabase `open-app`:
 * 302 to the native scheme so Mail/clients open the app instead of a landing page.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  const destination = buildNativeOpenUrl(path);
  return NextResponse.redirect(destination, 302);
}
