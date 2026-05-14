import { NextResponse } from "next/server";

import { collectAndroidAppLinkFingerprints } from "@/shared/lib/android-app-link-sha256";

/**
 * Android App Links — JSON array; no redirect.
 * Fingerprints: `BUZLEE_ANDROID_SHA256` (comma-separated) and/or one-per-line
 * `data/android-app-link-sha256.txt` (Play App Signing cert — not secret).
 */
export async function GET() {
  const packageName =
    process.env.BUZLEE_ANDROID_PACKAGE_NAME?.trim() || "com.buzlee";
  const sha256_cert_fingerprints = collectAndroidAppLinkFingerprints();

  const body =
    sha256_cert_fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: packageName,
              sha256_cert_fingerprints,
            },
          },
        ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
