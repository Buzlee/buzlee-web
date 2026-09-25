/**
 * Supabase server client for /admin server components and route handlers.
 * Cookie-based session via @supabase/ssr (getAll/setAll contract).
 * Anon key only — RLS `is_admin()` is the enforcement layer.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./supabase";

/**
 * Create a per-request server client. Call only after checking
 * `isSupabaseConfigured()` — throws when Supabase env vars are absent.
 */
export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured — guard callers with isSupabaseConfigured().",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: src/proxy.ts refreshes the session for /admin.
        }
      },
    },
  });
}
