# Admin v2 — Status & Roadmap

Last updated: 2026-09-01. Companion to [admin-sync.md](./admin-sync.md) (port provenance / sync checklist).

The admin redesign spans two repos, driven by the Paper Desktop file "Buzlee" (mobile page `A-0`, web page `B-0`). Everything is scoped to **dev/preview only** — never merge to `main` without a deliberate release decision. Production `/admin` stays a 404 until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are deliberately added to Vercel's Production environment (they are set in Preview + Development only).

## Shipped

**Web (this repo, branch `feat/admin-web-dashboard`)**
- Foundation: Supabase browser/server clients (`src/shared/lib/supabase.ts` is the port seam — same import path as buzlee-app), `src/proxy.ts` (matcher `/admin/:path*` only), `/admin/sign-in`, env kill-switch.
- Shell: sidebar + header + status chips; auth gate in `admin/(dashboard)/layout.tsx` (`getUser()` + `profiles.role === 'admin'`; RLS `is_admin()` is the real enforcement; anon key only, no service role anywhere).
- Data layer: `entities/admin/*` + claim queries ported from buzlee-app with provenance headers (see admin-sync.md for the file list and web-only deviations).
- Screens: Inbox (queues + domain-match pills), Businesses (chips/search/Deleted+Restore), business Review (master-detail, `?id=` deep link, auto-advance), Flyers, Residents (side panel).
- Polish: reject/delete/confirm dialogs, keyboard shortcuts (↑↓/A/R), skeletons, toasts.
- Vercel preview live: `https://buzlee-web-git-feat-admin-web-dashboard-buzlee.vercel.app/admin` (behind team SSO — be logged into Vercel).

**Mobile (buzlee-app, on `dev` + `preview`)**
- Full inbox-model redesign (`72fc268`) + routing fix for the `(admin-detail)` stack (`0638581`). OTA published to both channels.

## Remaining work (priority order)

1. **Edit business form (web)** — the review screen's `⋯ → Edit details` item is rendered disabled; there is no web edit flow yet. Biggest functional gap vs mobile.
2. **Claim history (web + mobile)** — the old mobile claims screen had a Pending/Approved/Rejected filter with rejection reasons; the new UI on both apps only surfaces pending claims. `useBusinessClaims(status)` / `use-admin-claims.ts` already support status filtering — only screens are missing.
3. **Batch upload + map (web)** — sidebar TOOLS links have no web destination (mobile-only features today). Build, or mark as mobile-only.
4. **Lift `CLAIM_DECLINE_REASONS`** into `entities/admin/model/moderation.ts` in both repos (currently duplicated inline in web `inbox-screen` and mobile `claim-review`).
5. **Live-data smoke test** on preview: approve → reject → soft delete → restore → claim approve/decline, confirming each change appears in the mobile app (same Supabase project) and that `app.buzlee.com/admin` still 404s.

## Invariants (do not break)

- `src/proxy.ts` matcher must stay scoped to `/admin/:path*` — `/auth/callback`, `/flyer/[id]`, `/business/[id]`, and `.well-known/*` are mobile-app infrastructure on this domain.
- No service-role key in this repo, ever. Anon key + RLS is the security model.
- Never run `supabase db push` or equivalent (repo rule); the admin feature required zero migrations.
- When either repo's admin data layer changes, run the admin-sync.md checklist in the same PR.
