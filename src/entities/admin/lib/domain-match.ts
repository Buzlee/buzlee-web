/**
 * Claim-vetting helper: does the claimant's email domain match the
 * business's known email/website domain? Pure functions, web-only.
 *
 * "Domain" here is the full hostname minus a leading `www.` (no public
 * suffix list) — good enough to flag obvious mismatches for a human
 * reviewer, not an anti-fraud boundary.
 */

export type ClaimDomainMatchStatus = "match" | "mismatch" | "unknown";

export type ClaimDomainMatch = {
  status: ClaimDomainMatchStatus;
  claimDomain: string | null;
  businessDomain: string | null;
};

const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function normalizeHost(host: string): string | null {
  const cleaned = host
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "");
  return DOMAIN_RE.test(cleaned) ? cleaned : null;
}

/**
 * Extract the registrable-ish domain from an email address or URL.
 * Returns null for empty, unparseable, or dotless values.
 */
export function extractDomain(
  emailOrUrl: string | null | undefined,
): string | null {
  const value = emailOrUrl?.trim().toLowerCase();
  if (!value) return null;

  const atIndex = value.lastIndexOf("@");
  if (atIndex > 0 && atIndex < value.length - 1) {
    return normalizeHost(value.slice(atIndex + 1));
  }

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}

/**
 * Compare the claimant's email domain against the business's email domain
 * (preferred) or website domain. Missing/invalid inputs → 'unknown'.
 */
export function claimDomainMatch({
  claimEmail,
  businessEmail,
  businessWebsite,
}: {
  claimEmail: string | null | undefined;
  businessEmail: string | null | undefined;
  businessWebsite: string | null | undefined;
}): ClaimDomainMatch {
  const claimDomain = extractDomain(claimEmail);
  const businessDomain =
    extractDomain(businessEmail) ?? extractDomain(businessWebsite);

  if (!claimDomain || !businessDomain) {
    return { status: "unknown", claimDomain, businessDomain };
  }

  return {
    status: claimDomain === businessDomain ? "match" : "mismatch",
    claimDomain,
    businessDomain,
  };
}
