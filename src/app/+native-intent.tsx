import { toPaymentInputPath } from '@/lib/lightning/deep-link';

export function redirectSystemPath({ path, initial: _initial }: { path: string; initial: boolean }) {
  try {
    return toPaymentInputPath(path) ?? path;
  } catch {
    return '/(app)';
  }
}
