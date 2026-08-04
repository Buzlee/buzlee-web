import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Temporary diagnostic: reports only whether share-page env vars are visible at runtime. */
export async function GET() {
  const url = process.env.BUZLEE_SUPABASE_URL ?? "";
  const key = process.env.BUZLEE_SUPABASE_ANON_KEY ?? "";
  return NextResponse.json({
    urlSet: url.length > 0,
    keySet: key.length > 0,
    urlLooksQuoted: url.startsWith('"') || url.startsWith("'"),
    urlHost: url ? url.replace(/^["']+/, "").slice(0, 30) : null,
  });
}
