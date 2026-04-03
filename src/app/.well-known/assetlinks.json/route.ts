import { NextResponse } from "next/server";

/**
 * Android App Links — JSON array; no redirect.
 * `BUZLEE_ANDROID_SHA256` comma-separated SHA-256 cert fingerprints (see Play Console / `keytool`).
 */
export async function GET() {
  const packageName =
    process.env.BUZLEE_ANDROID_PACKAGE_NAME?.trim() || "com.buzlee";
  const raw = process.env.BUZLEE_ANDROID_SHA256 ?? "";
  const sha256_cert_fingerprints = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
