// Shared guard for any user-supplied URL that ends up in an href/src (Featured
// Content, website, socials, …). Without this, a creator could store a
// `javascript:`/`data:` URI that executes when another user clicks it — a
// stored, cross-user XSS vector. Only same-origin relative paths and http(s)
// absolute URLs are allowed through.
const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export function sanitizeUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  if (value.startsWith("/")) {
    // Reject protocol-relative ("//evil.com") and backslash variants — both
    // are parsed as an absolute URL by browsers despite the leading slash(es).
    if (value.startsWith("//") || value.startsWith("/\\")) return null;
    return value;
  }

  try {
    const parsed = new URL(value);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? value : null;
  } catch {
    return null;
  }
}

// For post-auth redirect targets ("next" query params): only a same-origin
// relative path is ever a legitimate value, so absolute URLs are rejected
// outright (unlike sanitizeUrl, which allows http/https for user-content
// links). This also closes the "userinfo @" trick — a value like
// "@evil.com/x" concatenated onto an origin (`${origin}${next}`) parses as
// `https://origin@evil.com/x`, i.e. a redirect to evil.com — by requiring the
// value to start with exactly one "/".
export function sanitizeRedirectPath(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value.startsWith("/")) return "/home";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/home";
  return value;
}

// For fields like "website" where users commonly omit the scheme
// (e.g. "example.com"). Coerces to https:// first, then applies the same
// protocol allow-list so a `javascript:`-style value still can't sneak through.
export function sanitizeWebsiteUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return sanitizeUrl(withScheme);
}
