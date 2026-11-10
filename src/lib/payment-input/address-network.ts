import { Address } from 'bdk-rn';

import { toBdkNetwork } from '@/lib/bdk/network';
import type { AppNetwork } from '@/lib/context/breez-context';

/** Whether BDK accepts the address for that network. Local: unlike the Breez parse, it works while Breez is not started. */
export function isValidAddress(address: string, network: AppNetwork): boolean {
  try {
    return !!new Address(address, toBdkNetwork(network));
  } catch {
    return false;
  }
}
