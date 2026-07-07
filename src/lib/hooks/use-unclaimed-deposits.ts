import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from 'react-native-flash-message';

import { getActionableDeposits, getDepositKey, getRequiredClaimFeeSats } from '@/lib/breez/unclaimed-deposits-log';
import { useBreez } from '@/lib/context/breez-context';

export function useUnclaimedDeposits() {
  const { t } = useTranslation();
  const { unclaimedDeposits, refreshUnclaimedDeposits, claimDeposit: contextClaimDeposit, isBreezInitialized } = useBreez();
  const [isLoading, setIsLoading] = useState(false);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const actionableDeposits = useMemo(() => getActionableDeposits(unclaimedDeposits), [unclaimedDeposits]);

  useEffect(() => {
    if (!isBreezInitialized) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    refreshUnclaimedDeposits()
      .catch((error) => {
        console.warn('[UnclaimedDeposits] Failed to refresh:', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isBreezInitialized, refreshUnclaimedDeposits]);

  const claimDeposit = useCallback(
    async (deposit: DepositInfo) => {
      const requiredFeeSats = getRequiredClaimFeeSats(deposit);
      if (requiredFeeSats === null) {
        return;
      }

      const key = getDepositKey(deposit);
      setClaimingKey(key);

      try {
        await contextClaimDeposit(deposit.txid, deposit.vout, requiredFeeSats);
        showMessage({
          message: t('lnWallet.manualClaimModal.success'),
          type: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('[UnclaimedDeposits] Claim failed:', error);
        showMessage({
          message: t('lnWallet.manualClaimModal.error'),
          type: 'danger',
          duration: 3000,
        });
      } finally {
        setClaimingKey(null);
      }
    },
    [contextClaimDeposit, t],
  );

  return {
    actionableDeposits,
    isLoading,
    claimDeposit,
    claimingKey,
    getDepositKey,
  };
}
