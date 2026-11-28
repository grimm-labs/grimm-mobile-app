/* eslint-disable react/no-unstable-nested-components */
import { Env } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import * as Application from 'expo-application';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import DetailRow from '@/components/detail-row';
import { HeaderTitle } from '@/components/header-title';
import { Button, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { exportSdkLogs } from '@/lib/breez/sdk-logs';
import { formatDepositsSummary, logUnclaimedDeposits } from '@/lib/breez/unclaimed-deposits-log';
import { useBreez } from '@/lib/context';

function useExportSdkLogs() {
  const { t } = useTranslation();
  const { network } = useBreez();
  const [isExporting, setIsExporting] = useState(false);

  const exportLogs = useCallback(async () => {
    setIsExporting(true);
    try {
      const buildVersion = Application.nativeBuildVersion ? ` (${Application.nativeBuildVersion})` : '';
      const result = await exportSdkLogs({ appVersion: `${Env.VERSION}${buildVersion}`, platform: `${Platform.OS} ${Platform.Version}`, network, exportedAt: new Date() }, t('breezDetails.exportLogs.dialogTitle'));
      if (result === 'empty') showMessage({ message: t('breezDetails.exportLogs.empty'), type: 'info' });
      if (result === 'unavailable') showMessage({ message: t('breezDetails.exportLogs.unavailable'), type: 'danger' });
    } catch (error) {
      console.warn('[Breez SDK] Could not export the SDK logs:', error);
      showMessage({ message: t('breezDetails.exportLogs.error'), type: 'danger' });
    } finally {
      setIsExporting(false);
    }
  }, [network, t]);

  return { exportLogs, isExporting };
}

function ExportLogsSection() {
  const { t } = useTranslation();
  const { exportLogs, isExporting } = useExportSdkLogs();

  return (
    <View className="mb-6">
      <Text className="mb-3 text-sm text-gray-500 dark:text-charcoal-400">{t('breezDetails.exportLogs.description')}</Text>
      <Button testID="breez-sdk-export-logs" label={t('breezDetails.exportLogs.button')} fullWidth size="lg" variant="outline" loading={isExporting} onPress={exportLogs} />
    </View>
  );
}

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
      <SafeAreaView testID="breez-sdk-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen options={screenOptions} />
        <FocusAwareStatusBar />
        <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
          <View className="mb-6 mt-4">
            <DetailRow testID="breez-sdk-balance" label={t('breezDetails.balance')} value={breezWalletInfos?.balanceSats?.toString() || ''} expandable />
            <DetailRow testID="breez-sdk-deposits-status" label={t('breezDetails.unclaimedDepositsStatus')} value={debugStatus || t('breezDetails.unclaimedDepositsLoading')} expandable />
            <DetailRow testID="breez-sdk-deposits" label={t('breezDetails.unclaimedDeposits')} value={unclaimedDepositsSummary || t('breezDetails.unclaimedDepositsEmpty')} expandable />
            <Button testID="breez-sdk-refresh" label={t('breezDetails.unclaimedDepositsRefresh')} fullWidth size="lg" variant="secondary" onPress={fetchUnclaimedDeposits} />
          </View>
          <ExportLogsSection />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
