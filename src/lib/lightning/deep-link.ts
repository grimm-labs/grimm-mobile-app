const LIGHTNING_SCHEME = 'lightning:';

export function extractBolt11FromLightningUri(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed.toLowerCase().startsWith(LIGHTNING_SCHEME)) return null;

  const withoutScheme = trimmed.slice(LIGHTNING_SCHEME.length);
  const invoice = withoutScheme.split('?')[0].trim();

  if (!invoice) return null;
  return invoice;
}
