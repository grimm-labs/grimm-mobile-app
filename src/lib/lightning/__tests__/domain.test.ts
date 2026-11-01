import { domainOf } from '../domain';

describe('domainOf', () => {
  it.each([
    ['https://faucet.example.com/lnurlw/callback', 'faucet.example.com'],
    ['https://faucet.example.com:8443/lnurlw', 'faucet.example.com'],
    ['https://example.com/withdraw?k1=abc&amount=1000', 'example.com'],
    ['https://example.com?k1=abc', 'example.com'],
    ['https://example.com#fragment', 'example.com'],
    ['https://example.com', 'example.com'],
    ['https://a.b.faucet.example.com/x', 'a.b.faucet.example.com'],
    ['https://user:pass@example.com:443/x', 'example.com'],
    ['HTTPS://EXAMPLE.COM/X', 'example.com'],
    ['http://192.168.1.10:3000/lnurlw', '192.168.1.10'],
    ['http://abcdefghij.onion/lnurlw', 'abcdefghij.onion'],
  ])('returns the host of %s without port, path or query', (url, domain) => {
    expect(domainOf(url)).toBe(domain);
  });

  it.each(['not a url', 'https://', 'example.com/path', 'mailto:alice@example.com', '', 'https:///path'])('returns null for an invalid URL: "%s"', (url) => {
    expect(domainOf(url)).toBeNull();
  });
});
