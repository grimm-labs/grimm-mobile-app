import { useRouter } from 'expo-router';
import { useCallback, useContext } from 'react';

import { APP_LOCK_CARD_DISMISSED_KEY } from '@/lib/app-lock';
import { AppContext } from '@/lib/context/app-context-provider';
import { useAppLock } from '@/lib/context/app-lock-context';
import { useBdk } from '@/lib/context/bdk-context';
import { useBreez } from '@/lib/context/breez-context';
import { removeItem } from '@/lib/storage';

/**
 * The Wallet Reset, shared by Sign Out (Settings) and Forgot PIN (Lock Screen): deletes both wallets and the user's
 * wallet data, App Lock included, then goes back to the start (onboarding, as there is no Recovery Phrase any more).
 * Not exported from lib/hooks: it pulls in the Breez and BDK contexts.
 */
export const useWalletReset = () => {
  const { resetAppData } = useContext(AppContext);
  const { disconnectBreez } = useBreez();
  const { disconnectBdk } = useBdk();
  const { resetAppLock } = useAppLock();
  const router = useRouter();

  return useCallback(async () => {
    await resetAppData();
    await disconnectBreez();
    await disconnectBdk();
    await resetAppLock();
    await removeItem(APP_LOCK_CARD_DISMISSED_KEY);
    router.push('/');
  }, [resetAppData, disconnectBreez, disconnectBdk, resetAppLock, router]);
};
