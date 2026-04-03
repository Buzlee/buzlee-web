# Next steps: `app.buzlee.com` (buzlee-web)

Follow this order. Details of the architecture live in `buzlee-app` under `docs/implementation-plans/app-buzlee-com-auth-and-deeplinks.md`.

## 1. DNS (e.g. GoDaddy)

- In **Vercel** → project **buzlee-web** → **Domains**, add `app.buzlee.com` and copy the required DNS target.
- In your DNS host, create a record for host **`app`** (FQDN `app.buzlee.com`), usually **CNAME** to what Vercel shows (often `cname.vercel-dns.com` or a project-specific hostname).
- Wait until Vercel shows the domain **Valid** and HTTPS is issued.

## 2. Vercel (buzlee-web)

- Connect the repo if needed; set **Production branch** (e.g. `main`).
- Attach **`app.buzlee.com`** as the production domain (step 1).
- Set environment variables (see `.env.example` in this repo):

  | Variable | Notes |
  |----------|--------|
  | `NEXT_PUBLIC_APP_ORIGIN` | `https://app.buzlee.com` (no trailing slash) |
  | `NEXT_PUBLIC_AUTH_CALLBACK_URL` | Optional; full URL if you want it explicit. Must match Supabase allowlist and Expo `AUTH_CALLBACK_URL`. |
  | `NEXT_PUBLIC_APP_SCHEME` | Production app: `buzlee`. Preview web testing: e.g. `buzlee.preview` to match EAS preview builds. |
  | `BUZLEE_APPLE_APP_IDS` | Comma-separated `TEAMID.bundleId` (e.g. production `com.buzlee`). Powers `/.well-known/apple-app-site-association`. |
  | `BUZLEE_ANDROID_PACKAGE_NAME` | Default `com.buzlee` if unset. |
  | `BUZLEE_ANDROID_SHA256` | Comma-separated SHA-256 cert fingerprints for App Links. |

- Redeploy after changing env.

## 3. Supabase

- **Authentication → URL configuration:** add `https://app.buzlee.com/auth/callback` and every **preview** URL you use for real email tests (exact URLs).
- Review **`site_url`** vs product (marketing vs app origin).
- **Edge secrets** for transactional `open-app`: keep **`APP_URL`** as native scheme per branch (`buzlee.preview://`, `buzlee://`, etc.) — not the web auth callback.

## 4. Verify hosted routes

After deploy:

- `https://app.buzlee.com/auth/callback` — loads; query string preserved when you append `?code=…` or Supabase params.
- `https://app.buzlee.com/open?path=…` — loads (transactional landing).
- `https://app.buzlee.com/.well-known/apple-app-site-association` — JSON, `Content-Type: application/json`, no redirect.
- `https://app.buzlee.com/.well-known/assetlinks.json` — JSON array; fingerprints must match your **release** signing cert on Play.

## 5. Mobile (buzlee-app)

- Production EAS: **`AUTH_CALLBACK_URL=https://app.buzlee.com/auth/callback`** (and matching Supabase allowlist).
- Cold-start test: sign up / reset password → open email link on **iOS and Android** → app should open via Universal Links / App Links and complete the same flow as `buzlee://…`.

## 6. Optional later

- Point transactional emails to `https://app.buzlee.com/open?…` when you want desktop users on that path.
- Remove legacy `buzlee.app` associated domains / intent filters in the app after traffic has moved.
