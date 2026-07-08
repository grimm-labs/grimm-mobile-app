/* eslint-disable react/no-unstable-nested-components */
import { useFocusEffect } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import DetailRow from '@/components/detail-row';
import { HeaderTitle } from '@/components/header-title';
import { Button, FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import { formatDepositsSummary, logUnclaimedDeposits } from '@/lib/breez/unclaimed-deposits-log';
import { useBreez } from '@/lib/context';

export default function BreezSdkDetailsScreen() {
  const { t } = useTranslation();
  const { breezWalletInfos, isBreezInitialized, isConnected, listUnclaimedDeposits } = useBreez();
  const [unclaimedDepositsSummary, setUnclaimedDepositsSummary] = useState('');
  const [debugStatus, setDebugStatus] = useState('');

  const screenOptions = useMemo(
    () => ({
      headerTitle: () => <HeaderTitle title={t('breezDetails.header_title')} />,
      headerTitleAlign: 'center' as const,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  const fetchUnclaimedDeposits = useCallback(async () => {
    console.warn('[Breez SDK] BreezSdkDetailsScreen — fetch started', {
      isBreezInitialized,
      isConnected,
    });

    if (!isBreezInitialized || !isConnected) {
      const status = t('breezDetails.sdkNotReady');
      setDebugStatus(status);
      setUnclaimedDepositsSummary('');
      console.warn('[Breez SDK] BreezSdkDetailsScreen — skipped fetch:', status);
      return;
    }

    setDebugStatus(t('breezDetails.unclaimedDepositsLoading'));

    try {
      const deposits = await listUnclaimedDeposits();
      logUnclaimedDeposits(deposits, 'breez-sdk-screen');
      setUnclaimedDepositsSummary(formatDepositsSummary(deposits));
      setDebugStatus(t('breezDetails.unclaimedDepositsLastRefresh', { count: deposits.length, time: new Date().toLocaleTimeString() }));
    } catch (error) {
      console.warn('[Breez SDK] BreezSdkDetailsScreen — fetch failed:', error);
      setUnclaimedDepositsSummary(t('breezDetails.unclaimedDepositsError'));
      setDebugStatus(t('breezDetails.unclaimedDepositsError'));
    }
  }, [isBreezInitialized, isConnected, listUnclaimedDeposits, t]);

  useFocusEffect(
    useCallback(() => {
      console.warn('[Breez SDK] BreezSdkDetailsScreen — focused');
      fetchUnclaimedDeposits();
    }, [fetchUnclaimedDeposits]),
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen options={screenOptions} />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4">
            <DetailRow label={t('breezDetails.balance')} value={breezWalletInfos?.balanceSats?.toString() || ''} expandable />
            <DetailRow label={t('breezDetails.unclaimedDepositsStatus')} value={debugStatus || t('breezDetails.unclaimedDepositsLoading')} expandable />
            <DetailRow label={t('breezDetails.unclaimedDeposits')} value={unclaimedDepositsSummary || t('breezDetails.unclaimedDepositsEmpty')} expandable />
            <Button label={t('breezDetails.unclaimedDepositsRefresh')} fullWidth size="lg" variant="secondary" onPress={fetchUnclaimedDeposits} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
