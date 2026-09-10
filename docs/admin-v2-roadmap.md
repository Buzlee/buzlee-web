# Admin v2 — Status & Roadmap

Last updated: 2026-09-10. Companion to [admin-sync.md](./admin-sync.md) (port provenance / sync checklist).

The admin redesign spans two repos, driven by the Paper Desktop file "Buzlee" (mobile page `A-0`, web page `B-0`). Everything is scoped to **dev/preview only** — never merge to `main` without a deliberate release decision. Production `/admin` stays a 404 until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are deliberately added to Vercel's Production environment (they are set in Preview + Development only).

## Shipped

**Web (this repo, branch `feat/admin-web-dashboard`)**
- Foundation: Supabase browser/server clients (`src/shared/lib/supabase.ts` is the port seam — same import path as buzlee-app), `src/proxy.ts` (matcher `/admin/:path*` only), `/admin/sign-in`, env kill-switch.
- Shell: sidebar + header + status chips; auth gate in `admin/(dashboard)/layout.tsx` (`getUser()` + `profiles.role === 'admin'`; RLS `is_admin()` is the real enforcement; anon key only, no service role anywhere).
- Data layer: `entities/admin/*` + claim queries ported from buzlee-app with provenance headers (see admin-sync.md for the file list and web-only deviations).
- Screens: Inbox (queues + domain-match pills), Businesses (chips/search/Deleted+Restore), business Review (master-detail, `?id=` deep link, auto-advance), Flyers, Residents (side panel).
- Polish: reject/delete/confirm dialogs, keyboard shortcuts (↑↓/A/R), skeletons, toasts.
- Edit business (2026-09-10): review screen `⋯ → Edit details` opens a side sheet (`features/admin/review/edit-business-sheet.tsx`). Diff-only patch via `useAdminUpdateBusiness`. Catalog API (`entities/catalog/api`) and `fetchBusiness`/`useBusiness` ported from buzlee-app to support it.
- Create business + media + geocoded address (2026-09-10): Businesses header `Add listing` → `/admin/businesses/new` (`features/admin/businesses/create-business-screen.tsx`). Shared `business-form.tsx` (used by create + edit) now includes logo/cover upload (`components/image-field.tsx`, client-side crop to 1:1 / 16:9 JPEG, Supabase storage `business-assets`) and the Westchester address picker (`components/address-field.tsx`, ported `entities/location` over the `geocode-autocomplete` edge function) — web edits now set `location` (map pin) exactly like the app.
- Flyer review detail (2026-09-10): `/admin/flyers/review?id=` (`features/admin/flyers/flyer-review-screen.tsx`) — hero image, status chip, posted time, business link → business review, lineup chapters for multi-event flyers (`flyer-lineup.tsx`, port of mobile `AdminFlyerLineup`), When/Where/Category/Link/Details facts, take-down bar for live flyers. Flyers table rows + `⋯ → View flyer` open it. Ported `entities/flyer/lib` (helper/recurrence/occurrences/lineup) + `shared/lib/date-local`; `AdminFlyerSummary` re-synced with `flyer_type` + `events`. "View on map" omitted until item 4 lands.
- Claims (2026-09-10): sidebar `Claims` → `/admin/claims` (`features/admin/claims/claims-screen.tsx`) — Pending / Approved / Declined chips with counts, search, side panel (domain signal, contact facts, decision date, decline reason, approve/decline for pending). Inbox section headers now link "See all" to `/admin/businesses` and `/admin/claims`.
- `CLAIM_DECLINE_REASONS` lifted into `entities/admin/model/moderation.ts` (both repos, same strings).
- Vercel preview live: `https://buzlee-web-git-feat-admin-web-dashboard-buzlee.vercel.app/admin` (behind team SSO — be logged into Vercel).

**Mobile (buzlee-app, on `dev` + `preview`)**
- Full inbox-model redesign (`72fc268`) + routing fix for the `(admin-detail)` stack (`0638581`). OTA published to both channels.
- Claim history (2026-09-10): `app/(admin-detail)/claims.tsx` (Pending / Approved / Declined chips, search, rows open `claim-review/[id]`; declined rows show the reason inline). Reached from More → Tools → "Claim history" and Inbox → Claim requests → "See all". Not yet OTA-published.

## Goal: full web ↔ mobile admin parity

Stated 2026-09-10: the web admin must do everything the mobile admin does. Mobile (`buzlee-app/src/app/(admin)` + `(admin-detail)`) is the reference. Gap list below, priority order.

## Remaining work (priority order)

1. **Create / edit flyer (web)** — mobile `create-flyer/[businessId]` + `edit-flyer/[id]` wrap `features/flyer-wizard` (~76 files). Port the wizard model/API (`flyer-wizard/model/*`, `entities/flyer` mutations, flyer media upload) and build a web form; the address picker + image field from business-form are reusable.
2. **Batch upload (web)** — mobile `features/admin-batch-upload` (CSV parse → `resolve-rows` → row edit → insert; remote media fetch). Port `lib/` + `model/` verbatim, build a web table UI. Sidebar TOOLS link currently disabled.
3. **Map + discovery feed (web)** — mobile `discovery-map` / `discovery-feed` are read-only resident views (MapLibre + MapTiler, `features/discovery`, `features/filter`). Needs `MAPTILER_API_KEY` in Vercel (dev+preview) and a web map lib. Sidebar TOOLS link currently disabled. Once landed, add "View on map" to the flyer review bar (mobile parity).
4. **Residents CSV export (web)** — mobile `entities/admin/lib/residents-csv.ts` + share sheet. Port the lib, add an Export button on `/admin/residents`.
5. **Live-data smoke test** on preview: approve → reject → soft delete → restore → claim approve/decline → flyer review (single + multi-event lineup, take-down) → create business with logo/cover + address → edit-details (replace/remove images, change address) → confirm map pin + images in the mobile app, and that `app.buzlee.com/admin` still 404s. Then OTA-publish the mobile claims screen to dev + preview.
6. **Dev tools** — mobile `dev-tools` is development-build only; not a parity target.

## Invariants (do not break)

- `src/proxy.ts` matcher must stay scoped to `/admin/:path*` — `/auth/callback`, `/flyer/[id]`, `/business/[id]`, and `.well-known/*` are mobile-app infrastructure on this domain.
- No service-role key in this repo, ever. Anon key + RLS is the security model.
- Never run `supabase db push` or equivalent (repo rule); the admin feature required zero migrations.
- When either repo's admin data layer changes, run the admin-sync.md checklist in the same PR.
