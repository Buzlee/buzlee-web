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
| `src/entities/admin/lib/residents-csv.ts` | same | `buildResidentsCsv` verbatim; `exportResidentsCsv` keeps only the app's web (Blob download) branch |
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
| `src/entities/flyer/lib/age-restriction.ts` | same | verbatim (one `// Web fix:` — `minMonths!` → `?? 0`) |
| `src/entities/flyer/lib/flyer-datetime.ts` | same | verbatim |
| `src/entities/flyer/lib/send-member-flyer-notification.ts` | same | verbatim; `member-flyer-notify` edge function |
| `src/entities/flyer/api/flyer-queries.ts` | same | web trim — see "Web adaptations" |
| `src/entities/flyer/api/flyer-tag-queries.ts` | same | `fetchFlyerTags` + `setFlyerTags` only; join typed instead of `as any` |
| `src/entities/flyer/api/flyer-status-mutations.ts` | same | `publishFlyer` / `unpublishFlyer` / `deleteFlyerAndTrack` / `isFlyerEventPast`; each takes the caller's `QueryClient` (no module-level client on the web); no analytics |
| `src/entities/member/api/member-queries.ts`, `use-member.ts` | same | `fetchActiveMemberCount` / `useActiveMemberCount` + `memberKeys` only (`get_business_member_count` RPC) |
| `src/features/flyer-wizard/model/types.ts` | `src/features/admin/flyer-wizard/model/types.ts` | verbatim + `// Web fix:` optional `file?: File` on `FlyerMediaDraft` / `CoverPhotoDraft` |
| `src/features/flyer-wizard/model/create-flyer-draft.ts` | `src/features/admin/flyer-wizard/model/…` | verbatim |
| `src/features/flyer-wizard/model/wizard-steps.ts` | same (under `features/admin/flyer-wizard`) | verbatim; all step / flyer-type copy |
| `src/features/flyer-wizard/model/wizard-reducer.ts` | same | verbatim |
| `src/features/flyer-wizard/lib/serialize-flyer-draft.ts` | same | verbatim; builds the `upsert_flyer_with_events` payload |
| `src/features/flyer-wizard/lib/validate-wizard-step.ts` | same | verbatim (one `// Web fix:` — `Number.isNaN`) |
| `src/features/flyer-wizard/lib/section-status.ts` | same | verbatim |
| `src/features/flyer-wizard/lib/format-event-summary.ts` | same | verbatim |
| `src/features/flyer-wizard/lib/local-id.ts` | same | `crypto.randomUUID` instead of expo-crypto |
| `src/features/flyer-wizard/lib/event-colors.ts` | same | same three tokens (`--chart-1`, `--primary`, `--chart-5`) as Tailwind classes |
| `src/features/flyer-wizard/model/wizard-api.ts` | same | trimmed — no date/time sheet, no `saveAndExit` / `discardLocal`; `exit()` added |
| `src/features/flyer-wizard/model/use-flyer-wizard.ts` | same | see "Web adaptations" |
| `src/features/flyer-wizard/model/use-flyer-wizard-submit.ts` | same | see "Web adaptations" |
| `src/features/admin-inbox/model/triage-queue.ts` | `src/features/admin/inbox/model/triage-queue.ts` | verbatim + `// Web fix:` web hrefs (`/admin/businesses/review?id=`, `/admin/claims?id=`) and a contact-email fallback for the claimant title; `biome-ignore` on the `then` field |
| `src/features/admin-inbox/model/use-triage-queue.ts` | same (under `features/admin/inbox`) | verbatim |
| `src/features/admin-inbox/model/use-triage-store.ts` | same (under `features/admin/inbox`) | web adaptation — module store + `useSyncExternalStore` instead of Zustand; same `useTriageStore(selector)` shape, session-only (reload resets) |
| `src/features/admin-batch-upload/lib/csv.ts` | `src/features/admin/batch-upload/lib/csv.ts` | verbatim |
| `src/features/admin-batch-upload/lib/batch-row-schemas.ts` | same (under `features/admin/batch-upload`) | verbatim (zod 4; one `// Web fix:` — `parseAgeRestriction(v)!` → `?? undefined`) |
| `src/features/admin-batch-upload/lib/resolve-rows.ts` | same | verbatim (two `// Web fix:` — `rawRows.get(n)!` → `?? {}`) |
| `src/features/admin-batch-upload/lib/remote-media.ts` | same | verbatim except `MAX_MEDIA_BYTES` is exported and the fetch is relayed through `mediaProxyUrl()` — see "Web adaptations" |
| `src/features/admin-batch-upload/api/batch-upload-queries.ts` | same | verbatim |
| `src/features/admin-batch-upload/model/use-batch-upload.ts` | same | see "Web adaptations" (`pickAndValidate(file: File)`; `for…of`; also invalidates `adminKeys.statusCounts()`) |
| `src/features/admin-batch-upload/ui/row-field-defs.ts` | same | verbatim shape; RN `keyboardType` / `autoCapitalize` → HTML `inputMode` / `type` |
| `src/features/filter/model/types.ts` | `src/features/admin/discovery/model/filter-types.ts` | verbatim (`DATE_PRESETS`, `TIME_OF_DAY_OPTIONS`, `DEFAULT_FILTER_STATE`) |
| `src/features/filter/model/use-filter-state.ts` | `src/features/admin/discovery/model/use-filter-state.ts` | web adaptation — module store + `useSyncExternalStore` instead of Zustand; same `useFilterStore(selector)` shape and actions |
| `src/features/discovery/lib/filter-state-to-flyer-filters.ts` | `src/features/admin/discovery/lib/…` | verbatim |
| `src/features/discovery/lib/group-flyers-by-time-period.ts` | same | verbatim |
| `src/features/map/lib/map-constants.ts` | same | web trim — `MAP_ZOOM`, `MAP_BOUNDARIES`, `NATIVE_CLUSTER` (carousel/marker sizing constants omitted) |
| `src/features/map/lib/map-coordinates.ts` | same | web trim — `MapCoordinate`, `isValidCoordinate`, `coordinateFromFlyerLocation` |
| `src/features/map/lib/flyers-to-geojson.ts` | same | verbatim |
| `src/entities/flyer/api/flyer-queries.ts` (`getDateRangeFromPreset`, `fetchFlyersCore`, `fetchFlyers`) | same | verbatim additions to the existing web trim (2026-09-10) |
| `src/entities/flyer/api/use-flyer.ts` (`useFlyers`) | same | verbatim addition (`keepPreviousData`, 30s `staleTime` when `isLive`) |

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
- `entities/admin/api/admin-queries.ts` — the app's business/flyer/resident
  mappers read embedded relations through `as any`; the web repo lints
  `noExplicitAny`, so the joined rows are typed (`AdminBusinessRow`,
  `AdminFlyerRow`, `NamedRelation`) and the two business reads share one
  `ADMIN_BUSINESS_SELECT` + `mapAdminBusinessRow` (same pattern the app
  already uses for flyers). Select strings and output shape are identical;
  worth upstreaming.
- `entities/admin/api/use-admin.ts` — `userId!` → `requireUserId(userId)`
  (throws "Not signed in"); web `useAuth()` resolves the session async, the
  app's store is hydrated before mount.
- `entities/flyer/lib/flyer-helper.ts` — `(upcoming ?? latestPast)!` → explicit
  null check that throws; unreachable because `events` is non-empty there.
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
  multi-event flyers, facts, take-down bar with "View on map"
  (`discoveryMapHref`). Mirrors mobile
  `app/(admin-detail)/flyer-review/[id]`. `flyer-lineup.tsx` is the web port of
  `features/admin-flyer-review/ui/AdminFlyerLineup`.
- `src/features/admin/flyer-wizard/**` — web port of the mobile flyer wizard
  (admin variant). Model/lib files are verbatim ports (table above); the
  hooks and UI are web-specific:
  - `model/use-flyer-wizard.ts` — RN `Alert` decisions (multi → single,
    remove event, discard changes) go through the injected promise-based
    `confirm()` (`features/admin/dialogs/use-confirm.tsx`). The AsyncStorage
    autosave / resume and `usePreventRemove` are **not** ported: drafts live
    in memory for the page's lifetime and a `beforeunload` prompt guards
    reloads. No shared date/time sheet — the web stand-ins are
    `components/ui/date-picker.tsx` (shadcn `Calendar` in a popover) and
    `components/ui/time-picker.tsx` (Popover + `Command` combobox: 15-min
    slots, any typed minute, duration hints on a same-day end time). The
    discovery filter's specific date uses the same `DatePicker`.
  - `model/use-flyer-wizard-submit.ts` — same sequence as the app (encode →
    RPC upsert → media/cover upload → patch URLs → tags → invalidate →
    member notify; delete-rollback on a failed create). Uploads take Blobs
    from `lib/media.ts`: PDFs as-is, images re-encoded to JPEG (no crop,
    like the app's artwork picker), cover photos centre-cropped 2:3 like the
    app's `aspect: [2, 3]`. A removed cover is deleted only after the row
    no longer references it. Cache invalidation uses `useQueryClient` and
    also hits `adminKeys.flyers()` / `businessDetail` / `statusCounts`.
  - `ui/**` — `WizardShell` (nav row, progress segments, pinned footer),
    step screens mirroring the app's `basics / schedule / lineup /
    event-form / details / location / review`, chips, toggle, artwork
    dropzone (drag-and-drop + file picker, image or PDF), cover-photo row,
    age-restriction fields, tag selector (catalog `tags`, max 5, no tag
    creation), visibility choice with the live member count, review rows +
    preview card. The multi-event **lineup month calendar is not ported**
    (list only); the Location step shows the picked address plus the
    `LocationPreviewMap` pin preview (when the MapTiler key is set).
  - `ui/flyer-wizard-screen.tsx` — session orchestration; Unpublish /
    Delete on the live edit hub call `flyer-status-mutations` with the
    app's confirm copy.
- `src/features/admin/flyers/create-flyer-screen.tsx` /
  `edit-flyer-screen.tsx` — `/admin/flyers/new?business=<id>` and
  `/admin/flyers/edit?id=<flyerId>` (mobile: `(admin-detail)/create-flyer/[businessId]`,
  `edit-flyer/[id]`). Success → business review; cancel → back where you
  came from.
- `src/features/admin/review/business-flyers-panel.tsx` — port of mobile
  `AdminBusinessFlyersPanel` (Create flyer / View / Edit per flyer) using
  `useAdminFlyers({ businessId })`. Rendered on the business review page.
- `src/entities/flyer/api/flyer-queries.ts` — web trim of the app file:
  `fetchFlyer`, `normalizeFlyerEvents`, `upsertFlyerWithEvents`,
  `updateFlyer`, `deleteFlyer`, `uploadFlyerMedia` / `uploadFlyerCoverPhoto`
  (take a `Blob`; bucket `flyer-media`, paths `<id>/<ts>.jpg|pdf` and
  `<id>/cover-<ts>.jpg`, delete-after-upload — identical to the app),
  `deleteFlyerMedia` / `deleteFlyerCoverPhoto`, `cleanupOrphanedFlyerMedia`.
  The app's debug `console.log` ownership checks are dropped. The resident
  discovery list query (`fetchFlyers` + `getDateRangeFromPreset`) was added
  verbatim for Tools → Map (2026-09-10).
- `src/features/admin/claims/claims-screen.tsx` — web claim history
  (Pending / Approved / Declined chips, search, side panel with domain
  signal, decision date and decline reason; approve/decline for pending).
  Fetches `useBusinessClaims()` (all statuses) once and filters client-side.
  Mobile counterpart is `app/(admin-detail)/claims.tsx` (list only; tapping
  a row opens `claim-review/[id]`) — both read the same columns
  (`reviewed_at`, `rejection_reason`); no data-layer change was needed.
- `src/features/admin/inbox/**` — web port of the mobile Inbox
  (`app/(admin)/index.tsx` + `features/admin-inbox`): "Next up" card over the
  merged triage queue (Review now / Skip, Return and S shortcuts), grouped
  queue rows that only navigate (claims open `/admin/claims?id=`, which
  deep-links the claim panel), quiet "Live on Buzlee" totals. UI is
  web-specific (`ui/`); the triage model is ported (table above). The mobile
  `TriageStrip` on review screens is not ported yet.
- `CLAIM_DECLINE_REASONS` lives in `entities/admin/model/moderation.ts` in
  both repos (lifted 2026-09-10 from web `inbox-screen` and mobile
  `claim-review`). Keep the four strings identical across repos — the
  reason text is what claimants receive by email.

- `src/features/admin/batch-upload/**` — web port of the mobile admin batch
  upload (`features/admin-batch-upload`) at `/admin/tools/batch-upload`.
  lib/api/model are ports (table above); web-specific pieces:
  - `model/use-batch-upload.ts` — `pickAndValidate(file: File)` reads the
    CSV with `file.text()` (no expo-document-picker / expo-file-system);
    `CSV_ACCEPT` for the file input. Same parse → `resolveRows` → edit →
    upload state machine, same `uploadFlyerRow` / `createBusinessRow`.
  - `lib/csv-template.ts` — CSV templates generated from the zod schema
    keys (`flyerRowSchema.shape` / `businessRowSchema.shape`), downloaded via
    `shared/lib/download-file.ts` (`downloadTextFile`, BOM-prefixed Blob —
    also used by `entities/admin/lib/residents-csv.ts` now).
  - `ui/**` — dropzone + file picker, type toggle, review sections per row
    status (`row-status.ts` maps ready / skipped / needs-fix / uploaded /
    failed onto the existing `StatusChip` variants), `row-edit-sheet.tsx`
    (Sheet + shared `Field` from `business-form.tsx` + `ChoiceChips`),
    sticky upload bar, promise-based confirm.
- `src/app/admin/api/media-proxy/route.ts` — same-origin relay for the batch
  upload's remote media (`remote-media.ts` → `mediaProxyUrl()`); browsers
  cannot fetch third-party image hosts directly (CORS), the app has no such
  limit. Hardened: 404 when Supabase is unconfigured (kill switch), server
  `getUser()` + `profiles.role === 'admin'` (401/403), http(s) only, blocks
  localhost / private IPv4 / IPv6 literals, follows ≤ 5 redirects
  re-validating each hop, 30s timeout, 413 above `MAX_MEDIA_BYTES`, streams
  the upstream body with `cache-control: no-store`. Uses the anon key +
  cookie session only.
- `src/proxy.ts` — `/admin/api/*` is exempt from the sign-in redirect (route
  handlers return 401/403 themselves). Matcher unchanged (`/admin/:path*`).
- `src/features/admin/discovery/**` — web port of the mobile admin
  discovery map + feed (`app/(admin-detail)/discovery-map` /
  `discovery-feed`, `features/discovery`, `features/filter`, `features/map`)
  at `/admin/tools/map` (Tools → Map). One route, Map / List toggle
  (`?view=list`), the app's `?flyerId=` deep link (fetch via `useFlyer`,
  merge into the dataset, fly to `FOCUS_FLYER_ZOOM`, select, then strip the
  param). Read-only, like the app: the detail panel links to
  `/admin/flyers/review?id=`. Data: `useFlyers(filterStateToFlyerFilters(
  state, { restrictToLiveFlyers: true }))`; map shows every flyer with a
  valid coordinate (admin viewer — no upcoming filter, as in
  `DiscoveryMapView`), list filters `isFlyerEventUpcomingForDiscovery` and
  sorts by `getFlyerSortTimestamp` like the admin feed screen.
  - Map: **MapLibre GL JS** (`maplibre-gl`) with the same MapTiler style ids
    as the app (`lib/map-style.ts`, light/dark by `.dark`), bounded by
    `MAP_BOUNDARIES`, min/max zoom from `MAP_ZOOM`. Clustering uses
    MapLibre's native GeoJSON clustering with the app's `NATIVE_CLUSTER`
    radius / max-zoom instead of porting supercluster + RN markers
    (`ui/flyer-map.tsx`; `ui/use-maplibre.ts` owns the map lifecycle). Pins
    are circle layers coloured from the theme tokens (`lib/theme-color.ts`
    reads `--color-primary` / `--color-foreground` / `--color-background`).
    MapLibre ≥ 6 resolves its web worker from `import.meta.url`, which the
    bundler rewrites (404 → blank map); `scripts/copy-maplibre-worker.mjs`
    (postinstall) copies `maplibre-gl-worker.mjs` + `maplibre-gl-shared.mjs`
    into the gitignored `public/vendor/maplibre-gl/` and `use-maplibre.ts`
    calls `setWorkerUrl()` with that path.
    The element handed to MapLibre is never styled with Tailwind layout
    utilities: `maplibre-gl.css` is unlayered and its
    `.maplibregl-map { position: relative }` beats anything in
    `@layer utilities` (`absolute` / `inset-0`), so the container collapsed
    to 0px in production builds (blank map, 2026-09-10). Each map component
    styles a wrapper and gives the hook a plain `h-full w-full` div.
    `useMapLibre` returns `{ map, error }`; the MapLibre constructor throws
    synchronously without WebGL2, which the discovery map renders as an
    inline notice (List view still works) and the wizard preview omits.
    Known gap: the style is picked once at mount — toggling dark mode
    doesn't re-style an open map.
    Clicking a cluster zooms to its expansion zoom; clicking a pin reports
    every flyer at that point → `FlyerStackPanel` (the app's colocated
    sheet). No realtime subscription (`useFlyerRealtimeSync` is not ported);
    data refreshes via React Query's 30s `staleTime` / refetch-on-focus.
  - Filters: `ui/filter-sheet.tsx` (tags with search / `+n more`, date
    presets or a specific `<input type="date">` → `setDateRange(
    "<d>T00:00:00", "<d>T23:59:59")`, time of day, towns with "All") and
    `ui/category-chips.tsx` (single-select, "All" resets) over the ported
    filter store. `ui/flyer-feed.tsx` groups with `groupFlyersByTimePeriod`.
  - `ui/location-preview-map.tsx` — static single-pin map under the flyer
    wizard Location step's address row (the app's map preview). Renders
    nothing when the key is unset, so the wizard never depends on it.
  - `lib/discovery-href.ts` — `discoveryMapHref(flyerId)` drives the flyer
    review bar's "View on map" (mobile parity) and the sidebar link.
  - Env: `NEXT_PUBLIC_MAPTILER_API_KEY` (Vercel **Development + Preview
    only**, `--type config`; MapTiler keys are client-side by design —
    restrict allowed origins in MapTiler). Unset → the map view renders a
    "MapTiler API key is not configured" notice; the list view still works.
    Builds succeed with or without it.
- `src/features/admin/lib/flyer-when.ts` — `formatFlyerWhen(flyer)` shared by
  the flyer review screen and the discovery cards/panel (multi-event summary
  line, single-event line, legacy fallback).

## RPC / edge-function contract

Everything the dashboard calls that is not a plain table select/update:

RPCs (SECURITY DEFINER unless noted; all gated on `is_admin()` in SQL):

- `count_businesses_by_status()` — dashboard stats
- `count_flyers_by_status()` — dashboard stats. **Only groups pending / approved / rejected** (the SQL filters those three), so `flyers.live` / `flyers.expired` are never present. Web-only fix: `entities/admin/api/live-flyer-count.ts` (head count of `flyers` where `status = 'live'` and `deleted_at IS NULL`) feeds the sidebar Flyers count and the Inbox "Live flyers" total; the Flyers screen's Live / Expired chips count their own lists. Mobile still reads `counts?.flyers['live'] ?? 0` on the admin index — same bug there.
- `get_admin_residents()` — resident directory incl. auth email
- `get_admin_deleted_businesses()` — soft-deleted rows hidden by RLS
- `admin_soft_delete_entity(p_entity, p_id)` — 15-day retention delete
- `admin_restore_entity(p_entity, p_id)` — undo soft delete
- `upsert_flyer_with_events(p_flyer, p_events)` — flyer wizard create/edit (id-preserving event replace)
- `get_business_member_count(p_business_id)` — "Members only" helper copy in the wizard
- `approve_business_claim(p_claim_id)` — claim approval (atomic)
- `reject_business_claim(p_claim_id, p_reason)` — claim rejection
- `is_admin()` — used inside RLS policies (not called directly)

Edge functions (invoked with the user's JWT; they authorize admin):

- `admin-hard-delete` — permanent delete incl. storage/auth cleanup
- `business-status-email` — approval/rejection email
- `business-claim-invite` — “claim your business” invite email
- `business-claim-approved-email` — claim-approved email
- `member-flyer-notify` — notifies business members when a flyer goes live (wizard publish / edit of a live flyer)

Direct table access relies on admin RLS policies for: `businesses`
(select/insert/update), `flyers` (select/update/delete), `flyer_tags`
(select/insert/delete), `tags` (select), `business_claims` (select),
`profiles` (select own role). Storage: `flyer-media` (upload/remove/list)
and `business-assets` (upload/remove).

## Auth flow

- `/admin/sign-in` — email+password (`signInWithPassword`), cookie
  session via @supabase/ssr.
- `/admin/auth/callback` — server-side `exchangeCodeForSession` for
  OAuth/PKCE. Distinct from `/auth/callback`, which is the native-app
  deep-link hand-off page — never merge them.
- `src/proxy.ts` refreshes the session cookie and redirects
  unauthenticated `/admin/*` requests to sign-in; the dashboard layout
  then checks `profiles.role === 'admin'` and RLS enforces the rest.
