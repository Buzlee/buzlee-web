/**
 * Supabase browser client for the /admin dashboard.
 *
 * Exported as `supabase` at this exact path so files ported from
 * buzlee-app (`import { supabase } from '@/shared/lib/supabase'`) work
 * with zero diff — see docs/admin-sync.md.
 *
 * Auth: anon key + cookie session only (via @supabase/ssr). There is NO
 * service-role key anywhere in this repo; the `is_admin()` RLS layer in
 * the database is the enforcement boundary.
 *
 * The client is created lazily behind a Proxy so this module can be
 * imported (and pages prerendered) when the Supabase env vars are absent
 * — the production kill switch: without env vars /admin 404s and this
 * client is never actually used.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Tolerate values pasted with surrounding quotes or whitespace (e.g. copied from a quoted .env). */
function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

export type SupabaseConfig = { url: string; anonKey: string };

/**
 * Env cascade mirrors src/shared/lib/supabase-public.ts. The NEXT_PUBLIC_
 * names are the ones inlined into client bundles; the BUZLEE_/plain names
 * are tolerated for server-only contexts.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    cleanEnv(process.env.BUZLEE_SUPABASE_URL) ||
    cleanEnv(process.env.SUPABASE_URL);
  const anonKey =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.BUZLEE_SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_KEY);
  if (!url || !anonKey) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

/** True when the Supabase env vars are present — the /admin kill switch. */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

let client: SupabaseClient<Database> | null = null;

function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing). /admin is intentionally inert without them.",
    );
  }
  client = createBrowserClient<Database>(config.url, config.anonKey);
  return client;
}

/**
 * Lazy singleton: instantiated on first property access, so importing this
 * module never throws when env vars are absent (kill-switch builds).
 */
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop, _receiver) {
      const instance = getSupabaseBrowserClient();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  },
);
