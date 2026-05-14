import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_FILE = join(process.cwd(), "data", "android-app-link-sha256.txt");

/** Strip comments (# or end-of-line #) and split on commas / newlines. */
export function parseSha256Input(raw: string): string[] {
  const tokens: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const code = (line.split("#")[0] ?? "").trim();
    if (!code) continue;
    for (const part of code.split(",")) {
      const t = part.trim();
      if (t) tokens.push(t);
    }
  }
  return tokens;
}

/**
 * Play / keytool fingerprints: 64 hex chars, with or without colons/spaces, optional `SHA256:` prefix.
 */
export function normalizeSha256Fingerprint(input: string): string | null {
  let s = input.trim();
  const shaPrefix = /^sha-?256\s*:\s*/i;
  if (shaPrefix.test(s)) s = s.replace(shaPrefix, "");
  const hex = s.replace(/[\s:.-]/g, "").toUpperCase();
  if (!/^[0-9A-F]{64}$/.test(hex)) return null;
  const pairs = hex.match(/.{2}/g);
  return pairs ? pairs.join(":") : null;
}

export function collectAndroidAppLinkFingerprints(): string[] {
  const fromEnv = parseSha256Input(process.env.BUZLEE_ANDROID_SHA256 ?? "");
  let fromFile: string[] = [];
  if (existsSync(DATA_FILE)) {
    fromFile = parseSha256Input(readFileSync(DATA_FILE, "utf8"));
  }
  const normalized = [...fromEnv, ...fromFile]
    .map(normalizeSha256Fingerprint)
    .filter((x): x is string => x != null);
  return [...new Set(normalized)];
}
