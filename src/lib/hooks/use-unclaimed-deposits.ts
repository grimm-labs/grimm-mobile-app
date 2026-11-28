import type { DepositInfo } from '@breeztech/breez-sdk-spark-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageType } from 'react-native-flash-message';
import { showMessage } from 'react-native-flash-message';

import type { ClaimResult } from '@/lib/breez/deposits';
import { getActionableDeposits, getDepositKey, getRequiredClaimFeeSats, getVisibleDeposits } from '@/lib/breez/deposits';
import { useBreez } from '@/lib/context/breez-context';

type ClaimMessage = { message: string; type: MessageType };

function useClaimMessage() {
  const { t } = useTranslation();
  return useCallback(
    (result: ClaimResult): ClaimMessage => {
      switch (result.kind) {
        case 'credited':
          return { message: t('lnWallet.manualClaimModal.success'), type: 'success' };
        case 'crediting':
          return { message: t('lnWallet.claimResult.crediting'), type: 'info' };
        case 'feeChanged':
          return { message: t('lnWallet.claimResult.feeChanged', { fee: Number(result.requiredFeeSats).toLocaleString('en-US') }), type: 'warning' };
        case 'notYet':
          return { message: t('lnWallet.claimResult.notYet'), type: 'info' };
        case 'inProgress':
          return { message: t('lnWallet.claimResult.inProgress'), type: 'info' };
        case 'tooSmall':
          return { message: t('lnWallet.claimResult.tooSmall'), type: 'warning' };
      }
    },
    [t],
  );
}

export function useUnclaimedDeposits() {
  const { t } = useTranslation();
  const { unclaimedDeposits, refreshUnclaimedDeposits, claimDeposit: contextClaimDeposit, isBreezInitialized } = useBreez();
  const [isLoading, setIsLoading] = useState(false);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const claimMessage = useClaimMessage();

  const deposits = useMemo(() => getVisibleDeposits(unclaimedDeposits), [unclaimedDeposits]);
  const actionableDeposits = useMemo(() => getActionableDeposits(deposits), [deposits]);

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

      setClaimingKey(getDepositKey(deposit));

      try {
        const result = await contextClaimDeposit(deposit.txid, deposit.vout, requiredFeeSats);
        showMessage({ ...claimMessage(result), duration: 4000 });
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
    [claimMessage, contextClaimDeposit, t],
  );

  return {
    deposits,
    actionableDeposits,
    isLoading,
    claimDeposit,
    claimingKey,
    getDepositKey,
  };
}
