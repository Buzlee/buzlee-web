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
- Edit business (2026-09-10): review screen `⋯ → Edit details` opens a side sheet (`features/admin/review/edit-business-sheet.tsx`) — name, category, about, email + show-email, phone, website, address, town, social links. Diff-only patch via `useAdminUpdateBusiness`. Catalog API (`entities/catalog/api`) and `fetchBusiness`/`useBusiness` ported from buzlee-app to support it. Not yet: logo/cover upload, geocoded address (map pin unchanged when address edited on web).
- Claims (2026-09-10): sidebar `Claims` → `/admin/claims` (`features/admin/claims/claims-screen.tsx`) — Pending / Approved / Declined chips with counts, search, side panel (domain signal, contact facts, decision date, decline reason, approve/decline for pending). Inbox section headers now link "See all" to `/admin/businesses` and `/admin/claims`.
- `CLAIM_DECLINE_REASONS` lifted into `entities/admin/model/moderation.ts` (both repos, same strings).
- Vercel preview live: `https://buzlee-web-git-feat-admin-web-dashboard-buzlee.vercel.app/admin` (behind team SSO — be logged into Vercel).

**Mobile (buzlee-app, on `dev` + `preview`)**
- Full inbox-model redesign (`72fc268`) + routing fix for the `(admin-detail)` stack (`0638581`). OTA published to both channels.
- Claim history (2026-09-10): `app/(admin-detail)/claims.tsx` (Pending / Approved / Declined chips, search, rows open `claim-review/[id]`; declined rows show the reason inline). Reached from More → Tools → "Claim history" and Inbox → Claim requests → "See all". Not yet OTA-published.

## Remaining work (priority order)

1. **Batch upload + map (web)** — sidebar TOOLS links have no web destination (mobile-only features today). Build, or mark as mobile-only.
2. **Live-data smoke test** on preview: approve → reject → soft delete → restore → claim approve/decline, plus edit-details save and the Claims history views (web `/admin/claims`, mobile More → Claim history), confirming each change appears in the mobile app (same Supabase project) and that `app.buzlee.com/admin` still 404s. Then OTA-publish the mobile claims screen to dev + preview.
3. **Edit form follow-ups (web)** — logo/cover upload (needs a web upload path to Supabase storage; the app uses expo-file-system), and a geocoded address picker so web edits also update `location` (map pin). Low priority: both are doable in the app today.

## Invariants (do not break)

- `src/proxy.ts` matcher must stay scoped to `/admin/:path*` — `/auth/callback`, `/flyer/[id]`, `/business/[id]`, and `.well-known/*` are mobile-app infrastructure on this domain.
- No service-role key in this repo, ever. Anon key + RLS is the security model.
- Never run `supabase db push` or equivalent (repo rule); the admin feature required zero migrations.
- When either repo's admin data layer changes, run the admin-sync.md checklist in the same PR.
