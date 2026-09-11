/**
 * Same-origin relay for batch-upload media downloads.
 *
 * The mobile app fetches `media_url` directly (React Native has no CORS);
 * a browser cannot — Google Drive / Dropbox / most hosts send no
 * `Access-Control-Allow-Origin`. `fetchRemoteMedia` therefore fetches
 * `/admin/api/media-proxy?url=…` and this handler performs the upstream
 * request server-side, passing status + content-type through unchanged so
 * the ported error handling (HTTP status, "returned a web page", size
 * limit) behaves exactly as in the app.
 *
 * Guards (this is an outbound fetch on behalf of a browser):
 * - admin session required (getUser + `profiles.role === 'admin'`) — the
 *   layout's gate does not cover route handlers, so it is re-checked here;
 * - http(s) only; hostnames that are loopback / private / link-local
 *   literals are refused, and redirects are followed manually so every hop
 *   is re-validated;
 * - upstream `Content-Length` above the app's 15 MB media cap is refused
 *   before any bytes are relayed (bodies without a length are streamed and
 *   size-checked by the client, as in the app).
 */
import { NextResponse } from "next/server";
import { MAX_MEDIA_BYTES } from "@/features/admin/batch-upload/lib/remote-media";
import { isSupabaseConfigured } from "@/shared/lib/supabase";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const MAX_REDIRECTS = 5;
const UPSTREAM_TIMEOUT_MS = 30_000;

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "[::1]", "[::]"]);

/** IPv4 literal in a loopback, private, link-local or metadata range. */
function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const [a, b] = [Number(match[1]), Number(match[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isAllowedUpstream(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost")) return false;
  if (host.startsWith("[")) return false; // any other IPv6 literal
  return !isPrivateIpv4(host);
}

function text(status: number, message: string): NextResponse {
  return new NextResponse(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return text(401, "Sign in required");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return text(403, "Admin role required");
  return null;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const denied = await requireAdmin();
  if (denied) return denied;

  const raw = new URL(request.url).searchParams.get("url");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return text(400, "Invalid media URL");
  }

  const signal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedUpstream(target)) {
      return text(400, "Media URL host is not allowed");
    }

    let upstream: Response;
    try {
      upstream = await fetch(target, { redirect: "manual", signal });
    } catch {
      return text(502, "Could not reach the media host");
    }

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      if (!location) return text(502, "Redirect without a location");
      target = new URL(location, target);
      continue;
    }

    const length = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(length) && length > MAX_MEDIA_BYTES) {
      return text(413, "Media is larger than 15 MB");
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  }

  return text(502, "Too many redirects");
}
