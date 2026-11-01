// scheme://[userinfo@]host[:port][/path][?query][#fragment], read by hand: React Native's URL does not implement every
// getter (hostname among them) on every engine
const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const AUTHORITY_END = /[/?#]/;

/** The domain of a URL (its host, without port), to show which service a Withdrawal comes from; null for an invalid URL. */
export function domainOf(url: string): string | null {
  const trimmed = url.trim();
  const scheme = SCHEME.exec(trimmed);
  if (!scheme) return null;

  const authority = trimmed.slice(scheme[0].length).split(AUTHORITY_END)[0];
  const host = authority.slice(authority.lastIndexOf('@') + 1).split(':')[0];
  return host && !/\s/.test(host) ? host.toLowerCase() : null;
}
