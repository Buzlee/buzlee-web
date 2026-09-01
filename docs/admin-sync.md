# Admin dashboard — buzlee-app sync notes

The `/admin` dashboard ports its data layer from the sibling repo
`buzlee-app` (Expo). buzlee-app is the **source of truth**; files listed
below carry a `// PORTED FROM buzlee-app/...` header and should be
re-synced (not diverged) when the app changes.

## Hard rules

- **Never push to any database.** No `supabase db push`, no migrations,
  no schema changes from this repo. The dashboard consumes the existing
  schema/RPCs only.
- **No service-role key. Anywhere.** The dashboard uses the anon key +
  cookie session (@supabase/ssr). Authorization is enforced by RLS —
  `is_admin()` policies in the database — not by this app.

## Kill switch (production stays inert)

`/admin` requires `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. When they are absent:

- `src/proxy.ts` rewrites every `/admin/*` request to a 404, and
- the `/admin/(dashboard)` layout + sign-in page call `notFound()`.

Set the env vars in Vercel for **Development and Preview ONLY**.
**Production is intentionally left unset** so `/admin` 404s there until
the dashboard is cleared for production.

Local setup: `pnpm dlx vercel env pull .env.local` (after the vars exist
in Vercel), or add the two vars to `.env.local` by hand. The build must
always succeed with no Supabase env vars present (kill-switch path).

## Ported files (source → dest)

Same relative path under `src/` unless noted. "verbatim" = only the
provenance header added.

| buzlee-app source | buzlee-web dest | notes |
| --- | --- | --- |
| `src/types/database.ts` | `src/types/database.ts` | verbatim; regenerate in buzlee-app via `pnpm db:types`, then re-copy |
| `src/entities/admin/api/admin-queries.ts` | same | verbatim |
| `src/entities/admin/api/use-admin.ts` | same | see “Web adaptations” |
| `src/entities/admin/model/types.ts` | same | verbatim |
| `src/entities/admin/model/moderation.ts` | same | verbatim; REJECT_REASONS, FLYER_TAKEDOWN_REASONS, DELETE_RETENTION_DAYS, purge helpers |
| `src/entities/admin/lib/send-business-status-email.ts` | same | verbatim |
| `src/entities/admin/lib/send-business-claim-invite.ts` | same | verbatim; extra dependency of use-admin.ts |
| `src/entities/business/model/types.ts` | same | verbatim (types only) |
| `src/entities/flyer/model/types.ts` | same | verbatim (types only) |
| `src/entities/catalog/model/types.ts` | same | verbatim; type dependency of business types |
| `src/entities/business-claim/api/business-claim-queries.ts` | same | verbatim |
| `src/entities/business-claim/model/types.ts` | same | verbatim |
| `src/entities/business-claim/lib/send-claim-approved-email.ts` | same | verbatim |

Deliberately **not** ported: `entities/business-claim/api/use-business-claim.ts`
(RN/owner-side hooks) — replaced by the web-only
`src/entities/business-claim/api/use-admin-claims.ts`.

### Known deviations inside ported files

Marked with `// Web fix:` comments. The web repo runs @supabase/supabase-js
>= 2.100 (the app pins ^2.78), whose generated types are stricter about
nullability; buzlee-app's originals do not compile under it unchanged:

- `entities/admin/api/admin-queries.ts` — `approveBusiness`/`rejectBusiness`
  email payloads: `user_id`/`email` coerced with `?? ""` (nullable for
  unclaimed listings; the email edge function failure path already handles
  bad recipients non-blockingly).
- `entities/business-claim/api/business-claim-queries.ts` —
  `submitBusinessClaimWithToken` optional RPC args use `?? undefined`
  instead of `?? null` (omitted args hit the same SQL defaults).
- All ported files are reformatted by Biome (double quotes, `import type`)
  — re-sync by re-copying from buzlee-app and re-running `pnpm format`.

Note: buzlee-app has since grown `fetchAdminStatusCounts` /
`useAdminStatusCounts` / `AdminStatusCounts` (all status rows from the two
count RPCs) — ported verbatim inside admin-queries.ts / use-admin.ts /
model/types.ts and used for the sidebar nav counts.

## Web adaptations (new files, not ports)

- `src/shared/lib/supabase.ts` — browser client singleton exporting
  `supabase` at the exact import path buzlee-app files use
  (`@/shared/lib/supabase`), so ported files need zero import changes.
  Lazy (Proxy) so builds succeed without env vars.
- `src/shared/lib/supabase-server.ts` — server client for layouts/route
  handlers (`createSupabaseServerClient()`).
- `src/proxy.ts` — Next 16 proxy: kill switch + session refresh + auth
  redirect for `/admin/*` only.
- `src/entities/session/*` — minimal web `useAuth()` returning
  `{ userId }` from the Supabase session (buzlee-app's Zustand auth store
  is RN-specific and not ported).
- `src/entities/business/api/use-business.ts`,
  `src/entities/flyer/api/use-flyer.ts` — query-key factories only
  (copied from the buzlee-app originals; the hooks in those files are
  RN-specific and trimmed).
- `src/entities/business/api/business-queries.ts` — `updateBusiness`
  only (the full buzlee-app file uses expo-file-system for uploads).
- `src/entities/business-claim/api/use-admin-claims.ts` — React Query
  hooks over the ported claim queries (web-only).
- `src/entities/admin/lib/domain-match.ts` — pure claim-email vs
  business-domain comparison helpers (web-only).
- Claim-decline quick-pick reasons are web-local copy in
  `src/features/admin/inbox/inbox-screen.tsx` (`CLAIM_DECLINE_REASONS`) —
  buzlee-app has no equivalent constant yet; move it into moderation.ts in
  both repos if the app grows the same flow.

## RPC / edge-function contract

Everything the dashboard calls that is not a plain table select/update:

RPCs (SECURITY DEFINER unless noted; all gated on `is_admin()` in SQL):

- `count_businesses_by_status()` — dashboard stats
- `count_flyers_by_status()` — dashboard stats
- `get_admin_residents()` — resident directory incl. auth email
- `get_admin_deleted_businesses()` — soft-deleted rows hidden by RLS
- `admin_soft_delete_entity(p_entity, p_id)` — 15-day retention delete
- `admin_restore_entity(p_entity, p_id)` — undo soft delete
- `approve_business_claim(p_claim_id)` — claim approval (atomic)
- `reject_business_claim(p_claim_id, p_reason)` — claim rejection
- `is_admin()` — used inside RLS policies (not called directly)

Edge functions (invoked with the user's JWT; they authorize admin):

- `admin-hard-delete` — permanent delete incl. storage/auth cleanup
- `business-status-email` — approval/rejection email
- `business-claim-invite` — “claim your business” invite email
- `business-claim-approved-email` — claim-approved email

Direct table access relies on admin RLS policies for: `businesses`
(select/insert/update), `flyers` (select/update), `business_claims`
(select), `profiles` (select own role).

## Auth flow

- `/admin/sign-in` — email+password (`signInWithPassword`), cookie
  session via @supabase/ssr.
- `/admin/auth/callback` — server-side `exchangeCodeForSession` for
  OAuth/PKCE. Distinct from `/auth/callback`, which is the native-app
  deep-link hand-off page — never merge them.
- `src/proxy.ts` refreshes the session cookie and redirects
  unauthenticated `/admin/*` requests to sign-in; the dashboard layout
  then checks `profiles.role === 'admin'` and RLS enforces the rest.
