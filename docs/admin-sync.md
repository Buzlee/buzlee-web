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
| `src/entities/admin/model/moderation.ts` | same | verbatim; REJECT_REASONS, FLYER_TAKEDOWN_REASONS, CLAIM_DECLINE_REASONS, DELETE_RETENTION_DAYS, purge helpers |
| `src/entities/admin/lib/send-business-status-email.ts` | same | verbatim |
| `src/entities/location/model/types.ts` | same | verbatim |
| `src/entities/location/model/address-search.ts` | same | verbatim |
| `src/entities/location/model/address-field-copy.ts` | same | verbatim |
| `src/entities/location/api/geocoding-service.ts` | same | see “Web adaptations” (`supabase.functions.invoke` instead of `fetch` + `Env`) |
| `src/entities/location/api/use-location.ts` | same | verbatim |
| `src/entities/location/lib/formatted-address.ts` | same | verbatim |
| `src/entities/location/lib/geocoded-location-from-stored.ts` | same | verbatim |
| `src/entities/location/index.ts` | same | web barrel — omits RN UI, town-matching, zod location-schema |
| `src/entities/business/lib/social-links.ts` | same | verbatim |
| `src/entities/business/lib/business-address-update.ts` | same | verbatim |
| `src/entities/admin/lib/send-business-claim-invite.ts` | same | verbatim; extra dependency of use-admin.ts |
| `src/entities/business/model/types.ts` | same | verbatim (types only) |
| `src/entities/flyer/model/types.ts` | same | verbatim (types only) |
| `src/entities/flyer/lib/flyer-helper.ts` | same | verbatim; schedule/occurrence formatters |
| `src/entities/flyer/lib/flyer-recurrence.ts` | same | verbatim |
| `src/entities/flyer/lib/flyer-occurrences.ts` | same | verbatim |
| `src/entities/flyer/lib/lineup.ts` | same | verbatim; horizon grouping for the lineup |
| `src/entities/flyer/lib/index.ts` | same | web barrel — pure helpers only (no RN animations / notifications / age-restriction) |
| `src/shared/lib/date-local.ts` | same | verbatim; naive-local date helpers the flyer lib depends on |
| `src/entities/catalog/model/types.ts` | same | verbatim; type dependency of business types |
| `src/entities/business-claim/api/business-claim-queries.ts` | same | verbatim |
| `src/entities/business-claim/model/types.ts` | same | verbatim |
| `src/entities/business-claim/lib/send-claim-approved-email.ts` | same | verbatim |
| `src/entities/catalog/api/catalog-queries.ts` | same | verbatim; categories/towns for the edit form |
| `src/entities/catalog/api/use-catalog.ts` | same | verbatim |
| `src/entities/catalog/api/index.ts`, `src/entities/catalog/index.ts` | same | verbatim barrels |

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

Note (2026-09-10): `AdminFlyerSummary` now carries `flyer_type` and the
ordered `events: FlyerEvent[]` lineup (`ADMIN_FLYER_SELECT` embeds
`flyer_events(*)`); `admin-queries.ts` / `model/types.ts` were re-copied from
buzlee-app and the two `// Web fix:` blocks reapplied.

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
- `src/entities/business/api/business-queries.ts` — `fetchBusiness` +
  `updateBusiness` only (the full buzlee-app file uses expo-file-system
  for uploads). `useBusiness` is ported alongside the key factory in
  `use-business.ts`; the edit form needs the full row because
  `AdminBusinessSummary` omits `social_links` / `show_email`.
- `src/entities/business-claim/api/use-admin-claims.ts` — React Query
  hooks over the ported claim queries (web-only).
- `src/entities/admin/lib/domain-match.ts` — pure claim-email vs
  business-domain comparison helpers. buzlee-app has since grown the same
  helpers (plus tests) at `entities/business-claim/lib/domain-match.ts`;
  same exports, different path — re-home if the two ever diverge.
- `src/entities/business/api/business-queries.ts` — `uploadBusinessLogo`
  / `uploadBusinessCoverPhoto` / `deleteBusinessAsset` take a `Blob`
  (already centre-cropped + JPEG-encoded by
  `features/admin/lib/image.ts`) instead of the app's `ImageAsset` +
  expo-file-system. Bucket (`business-assets`), path
  (`<id>/logo-<ts>.jpg`), content type and delete-after-upload match the
  app. `cleanupOrphanedBusinessAssets` is not ported.
- `src/entities/location/api/geocoding-service.ts` — calls the same
  `geocode-autocomplete` edge function via `supabase.functions.invoke`
  (browser session supplies apikey + bearer). `GeocodingError.status` is
  read from `FunctionsHttpError.context.status`. Edge function already
  sends `Access-Control-Allow-Origin: *`.
- `src/features/admin/businesses/business-form.tsx` — shared field set
  (listing, media, contact, geocoded address, town, social) used by
  `create-business-screen.tsx` (`/admin/businesses/new`) and
  `review/edit-business-sheet.tsx`. Address picker is
  `components/address-field.tsx` (web AddressEntryField); media picker is
  `components/image-field.tsx`. Edit sends a diff-only patch; create posts
  via the ported `createUnclaimedBusiness`, then uploads staged media and
  patches URLs — same sequence as the app's create-business screen.
- `src/features/admin/flyers/flyer-review-screen.tsx` — web flyer detail
  (`/admin/flyers/review?id=`): hero image, status, business link, lineup for
  multi-event flyers, facts, take-down bar. Mirrors mobile
  `app/(admin-detail)/flyer-review/[id]` minus "View on map" (map not ported
  yet — roadmap item 4). `flyer-lineup.tsx` is the web port of
  `features/admin-flyer-review/ui/AdminFlyerLineup`.
- `src/features/admin/claims/claims-screen.tsx` — web claim history
  (Pending / Approved / Declined chips, search, side panel with domain
  signal, decision date and decline reason; approve/decline for pending).
  Fetches `useBusinessClaims()` (all statuses) once and filters client-side.
  Mobile counterpart is `app/(admin-detail)/claims.tsx` (list only; tapping
  a row opens `claim-review/[id]`) — both read the same columns
  (`reviewed_at`, `rejection_reason`); no data-layer change was needed.
- `CLAIM_DECLINE_REASONS` lives in `entities/admin/model/moderation.ts` in
  both repos (lifted 2026-09-10 from web `inbox-screen` and mobile
  `claim-review`). Keep the four strings identical across repos — the
  reason text is what claimants receive by email.

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
