import { extractBolt11FromLightningUri } from '@/lib/lightning/deep-link';

export function redirectSystemPath({ path, initial: _initial }: { path: string; initial: boolean }) {
  try {
    const rawInvoice = extractBolt11FromLightningUri(path);
    if (rawInvoice) {
      return `/send/transaction-details?rawInvoice=${encodeURIComponent(rawInvoice)}`;
    }
    return path;
  } catch {
    return '/(app)';
  }
}
