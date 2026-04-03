import { NextResponse } from "next/server";

/**
 * Apple Universal Links — must be `application/json`, no redirect.
 * Set `BUZLEE_APPLE_APP_IDS` to comma-separated `TEAMID.bundleId` values (production bundle: `com.buzlee`).
 */
export async function GET() {
  const raw = process.env.BUZLEE_APPLE_APP_IDS ?? "";
  const appIDs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const body = {
    applinks: {
      apps: [] as string[],
      details:
        appIDs.length === 0
          ? ([] as { appIDs: string[]; paths: string[] }[])
          : [
              {
                appIDs,
                paths: ["/auth/*", "/open", "/open/*"],
              },
            ],
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
