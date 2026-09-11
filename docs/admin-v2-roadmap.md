# Admin v2 — Status & Roadmap

Last updated: 2026-09-10. Companion to [admin-sync.md](./admin-sync.md) (port provenance / sync checklist).

The admin redesign spans two repos, driven by the Paper Desktop file "Buzlee" (mobile page `A-0`, web page `B-0`). Everything is scoped to **dev/preview only** — never merge to `main` without a deliberate release decision. Production `/admin` stays a 404 until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are deliberately added to Vercel's Production environment (they are set in Preview + Development only).

## Shipped

**Web (this repo — on `dev` + `preview`; ship = commit on `dev`, push, fast-forward `preview`)**
- Foundation: Supabase browser/server clients (`src/shared/lib/supabase.ts` is the port seam — same import path as buzlee-app), `src/proxy.ts` (matcher `/admin/:path*` only), `/admin/sign-in`, env kill-switch.
- Shell: sidebar + header + status chips; auth gate in `admin/(dashboard)/layout.tsx` (`getUser()` + `profiles.role === 'admin'`; RLS `is_admin()` is the real enforcement; anon key only, no service role anywhere).
- Data layer: `entities/admin/*` + claim queries ported from buzlee-app with provenance headers (see admin-sync.md for the file list and web-only deviations).
- Screens: Inbox (queues + domain-match pills), Businesses (chips/search/Deleted+Restore), business Review (master-detail, `?id=` deep link, auto-advance), Flyers, Residents (side panel).
- Polish: reject/delete/confirm dialogs, keyboard shortcuts (↑↓/A/R), skeletons, toasts.
- Edit business (2026-09-10): review screen `⋯ → Edit details` opens a side sheet (`features/admin/review/edit-business-sheet.tsx`). Diff-only patch via `useAdminUpdateBusiness`. Catalog API (`entities/catalog/api`) and `fetchBusiness`/`useBusiness` ported from buzlee-app to support it.
- Create business + media + geocoded address (2026-09-10): Businesses header `Add listing` → `/admin/businesses/new` (`features/admin/businesses/create-business-screen.tsx`). Shared `business-form.tsx` (used by create + edit) now includes logo/cover upload (`components/image-field.tsx`, client-side crop to 1:1 / 16:9 JPEG, Supabase storage `business-assets`) and the Westchester address picker (`components/address-field.tsx`, ported `entities/location` over the `geocode-autocomplete` edge function) — web edits now set `location` (map pin) exactly like the app.
- Flyer review detail (2026-09-10): `/admin/flyers/review?id=` (`features/admin/flyers/flyer-review-screen.tsx`) — hero image, status chip, posted time, business link → business review, lineup chapters for multi-event flyers (`flyer-lineup.tsx`, port of mobile `AdminFlyerLineup`), When/Where/Category/Link/Details facts, take-down bar for live flyers. Flyers table rows + `⋯ → View flyer` open it. Ported `entities/flyer/lib` (helper/recurrence/occurrences/lineup) + `shared/lib/date-local`; `AdminFlyerSummary` re-synced with `flyer_type` + `events`. "View on map" omitted until the map item lands.
- Residents CSV export (2026-09-10): `Export CSV` button on `/admin/residents` exports the visible (search-filtered) rows via ported `entities/admin/lib/residents-csv.ts` — same columns/escaping as the app.
- Create / edit flyer (2026-09-10): `/admin/flyers/new?business=` and `/admin/flyers/edit?id=` run the web port of the mobile flyer wizard (`features/admin/flyer-wizard`, model/lib ported verbatim; UI rebuilt with native date/time inputs, chips, a drag-and-drop artwork field, promise-based confirm dialog). Same 5 steps (basics → schedule/lineup → details → location → review), same validation, same `upsert_flyer_with_events` RPC + `flyer-media` uploads + `flyer_tags` + member notify + create-rollback as the app. Edit hub for live flyers: Save changes / Unpublish / Delete. Entry points: business review `⋯ → Create flyer` + a new **Flyers** panel (Create / View / Edit), flyer review header `Edit flyer`, flyers table `⋯ → Edit flyer`. Web deviations: no local draft autosave/resume (in-memory + `beforeunload` guard), no lineup month calendar (list only), no tag creation.
- Claims (2026-09-10): sidebar `Claims` → `/admin/claims` (`features/admin/claims/claims-screen.tsx`) — Pending / Approved / Declined chips with counts, search, side panel (domain signal, contact facts, decision date, decline reason, approve/decline for pending). Inbox section headers now link "See all" to `/admin/businesses` and `/admin/claims`.
- `CLAIM_DECLINE_REASONS` lifted into `entities/admin/model/moderation.ts` (both repos, same strings).
- Inbox redesign (2026-09-10): web port of the mobile "Next up" inbox (`features/admin/inbox`) — hero card for the oldest undecided item (Review now / session-only Skip, Return / S shortcuts), grouped whole-row queue lists with inset separators and no inline decisions, quiet "Live on Buzlee" totals that link to their lists. Claim rows now open the claim panel (`/admin/claims?id=` deep link) instead of the business review; Businesses accepts `?status=`. Dashboard `main` got `min-w-0` so truncated rows never widen the page.
- Batch upload (2026-09-10): sidebar Tools → `Batch upload` → `/admin/tools/batch-upload` (`features/admin/batch-upload`). Mobile `features/admin-batch-upload` lib/api/model ported verbatim (CSV parse → zod row schemas → `resolveRows` → per-row edit sheet → `uploadFlyerRow` / `createBusinessRow`); web UI: dropzone + file picker, businesses/flyers toggle, CSV template download (generated from the schemas), review sections by row status, sticky upload bar. Remote flyer media is relayed through the admin-only same-origin `/admin/api/media-proxy` route (browser CORS; hardened — see admin-sync.md).
- Map + discovery feed (2026-09-10): sidebar Tools → `Map` → `/admin/tools/map` (`features/admin/discovery`). MapLibre GL JS + the app's MapTiler style ids, native clustering with the app's `NATIVE_CLUSTER` params, Map / List toggle sharing the ported filter store (tags, category, date preset / specific date, time of day, town), colocated-pin stack, read-only detail panel → flyer review, `?flyerId=` deep link. Flyer review live bar now has "View on map"; the wizard Location step shows a pin preview. `NEXT_PUBLIC_MAPTILER_API_KEY` set in Vercel Development + Preview only (unset → notice, list view still works).
- Vercel builds: `https://buzlee-web-git-preview-buzlee.vercel.app/admin` (preview branch) and `https://buzlee-web-git-dev-buzlee.vercel.app/admin` (dev), both behind team SSO — be logged into Vercel. The old `feat/admin-web-dashboard` branch build is superseded.

**Mobile (buzlee-app, on `dev` + `preview`)**
- Full inbox-model redesign (`72fc268`) + routing fix for the `(admin-detail)` stack (`0638581`).
- Multi-event lineups on the admin flyer screens (`bd545d6`).
- Claim history (2026-09-10, `59b4dff`): `app/(admin-detail)/claims.tsx` (Pending / Approved / Declined chips, search, rows open `claim-review/[id]`; declined rows show the reason inline). Reached from More → Tools → "Claim history" and Inbox → Claim requests → "See all".
- "Next up" inbox hero with session-only skip (`ba26ce7`).
- All of the above are on `origin/dev` + `origin/preview` (head `ba26ce7`) and OTA-live: `.github/workflows/eas-update.yml` publishes on every push to `dev` (development channel) and `preview` (preview channel); the runs for `ba26ce7` on both branches succeeded 2026-09-10.

## Goal: full web ↔ mobile admin parity

Stated 2026-09-10: the web admin must do everything the mobile admin does. Mobile (`buzlee-app/src/app/(admin)` + `(admin-detail)`) is the reference. Gap list below, priority order.

## Remaining work (priority order)

1. **Live-data smoke test** on preview: approve → reject → soft delete → restore → claim approve/decline → flyer review (single + multi-event lineup, take-down, View on map) → create business with logo/cover + address → edit-details (replace/remove images, change address) → **create flyer (single, then multi with 2+ events; image + PDF artwork; cover photo; tags; age range; members-only; Location-step pin preview) → edit flyer (replace artwork, remove cover, save changes on a live flyer, unpublish, delete)** → residents Export CSV → **batch upload (businesses CSV, then flyers CSV with a remote image URL; fix a needs-fix row; verify duplicates are skipped)** → **Tools → Map (pins + clusters render, filters/category/date narrow the set, list view groups This Week / Next Week / Upcoming, colocated stack, deep link from flyer review)** → confirm map pin + images + the new flyers in the mobile app, and that `app.buzlee.com/admin` still 404s. Automated checks run on 2026-09-10: `tsc`, `biome check`, `next build` with and without the Supabase/MapTiler env (kill-switch path), unauthenticated `/admin/tools/map` → sign-in redirect. The signed-in click-through needs an admin session and is left for a human.
2. **Dev tools** — mobile `dev-tools` is development-build only; not a parity target.

## Invariants (do not break)

- `src/proxy.ts` matcher must stay scoped to `/admin/:path*` — `/auth/callback`, `/flyer/[id]`, `/business/[id]`, and `.well-known/*` are mobile-app infrastructure on this domain.
- No service-role key in this repo, ever. Anon key + RLS is the security model.
- Never run `supabase db push` or equivalent (repo rule); the admin feature required zero migrations.
- When either repo's admin data layer changes, run the admin-sync.md checklist in the same PR.
