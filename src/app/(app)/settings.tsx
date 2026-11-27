/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React, { useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LogoutBottomSheet } from '@/components/logout-bottom-sheet';
import { SettingsItem, SettingsSection, SettingsToggleItem } from '@/components/settings-item';
import { FocusAwareStatusBar, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { Env } from '@/lib/env';
import { useWalletReset } from '@/lib/hooks/use-wallet-reset';
import { theme } from '@/lib/theme-classes';

export default function Settings() {
  const { t } = useTranslation();
  const { isSeedPhraseBackup, hideBalance, setHideBalance, preventScreenCapture, setPreventScreenCapture } = useContext(AppContext);
  const resetWallet = useWalletReset();

  const router = useRouter();
  const logoutModalRef = useRef<any>(null);

  const signOut = () => {
    if (logoutModalRef.current) {
      logoutModalRef.current.present();
    }
  };

  const redirectToBackupSeedPhrase = () => {
    router.push('/settings/backup-seed-phrase/recovery-seed-phrase-warning');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="settings-screen" className={`flex-1 ${theme.screen}`}>
        <FocusAwareStatusBar />
        {/* flex-1 bounds the ScrollView to the screen height, otherwise it grows with its content and cannot scroll */}
        <View className="flex-1">
          <View className="border-b border-neutral-200 px-4 py-3 dark:border-charcoal-700">
            <Text className="text-2xl font-bold text-gray-800 dark:text-charcoal-100">{t('settings.title')}</Text>
          </View>

          <ScrollView testID="settings-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <SettingsSection title={t('settings.sections.general')}>
              <SettingsItem
                icon="git-network-outline"
                title={t('settings.general.networks.title')}
                subtitle={t('settings.general.networks.subtitle')}
                onPress={() => router.push('/settings/network')}
                testID="settings-networks"
              />
              <SettingsItem
                icon="server-outline"
                title={t('settings.general.esploraServer.title')}
                subtitle={t('settings.general.esploraServer.subtitle')}
                onPress={() => router.push('/settings/esplora-server')}
                testID="settings-esplora-server"
              />
              <SettingsItem icon="flag-outline" title={t('settings.general.country.title')} subtitle={t('settings.general.country.subtitle')} onPress={() => router.push('/settings/country')} testID="settings-country" />
              <SettingsItem
                icon="language-outline"
                title={t('settings.general.language.title')}
                subtitle={t('settings.general.language.subtitle')}
                onPress={() => router.push('/settings/language')}
                testID="settings-language"
              />
              <SettingsItem
                icon="logo-bitcoin"
                title={t('settings.general.bitcoinUnit.title')}
                subtitle={t('settings.general.bitcoinUnit.subtitle')}
                onPress={() => router.push('/settings/bitcoin-unit')}
                testID="settings-bitcoin-unit"
              />
              <SettingsItem
                icon="time-outline"
                title={t('settings.general.lnInvoiceExpiry.title')}
                subtitle={t('settings.general.lnInvoiceExpiry.subtitle')}
                onPress={() => router.push('/settings/ln-invoice-expiry')}
                testID="settings-ln-invoice-expiry"
              />
              <SettingsItem
                icon="at-outline"
                title={t('settings.general.lnAddress.title')}
                subtitle={t('settings.general.lnAddress.subtitle')}
                onPress={() => router.push('/settings/ln-address')}
                testID="settings-ln-address"
              />
            </SettingsSection>

            <SettingsSection title={t('settings.sections.security')}>
              <SettingsItem
                icon="lock-closed-outline"
                title={t('settings.security.appLock.title')}
                subtitle={t('settings.security.appLock.subtitle')}
                onPress={() => router.push('/settings/app-lock')}
                testID="settings-app-lock"
              />
              <SettingsItem icon="key-outline" title={t('settings.security.backup.title')} subtitle={t('settings.security.backup.subtitle')} onPress={redirectToBackupSeedPhrase} testID="settings-backup" />
              <SettingsToggleItem
                icon="eye-off-outline"
                title={t('settings.security.hideBalance.title')}
                subtitle={t('settings.security.hideBalance.subtitle')}
                value={hideBalance}
                onValueChange={setHideBalance}
                testID="settings-hide-balance"
              />
              <SettingsToggleItem
                icon="camera-outline"
                title={t('settings.security.preventScreenCapture.title')}
                subtitle={t('settings.security.preventScreenCapture.subtitle')}
                value={preventScreenCapture}
                onValueChange={setPreventScreenCapture}
                testID="settings-block-screenshots"
              />
            </SettingsSection>

            <SettingsSection title={t('settings.sections.preferences')}>
              <SettingsItem
                icon="notifications-outline"
                title={t('settings.preferences.notifications.title')}
                subtitle={t('settings.preferences.notifications.subtitle')}
                onPress={() => router.push('/settings/notifications')}
                testID="settings-notifications"
              />
              <SettingsItem
                icon="color-palette-outline"
                title={t('settings.preferences.appearance.title')}
                subtitle={t('settings.preferences.appearance.subtitle')}
                onPress={() => router.push('/settings/appearance')}
                testID="settings-appearance"
              />
            </SettingsSection>

            <SettingsSection title={t('settings.sections.developers')}>
              <SettingsItem
                icon="code-slash-outline"
                title={t('settings.developers.breez.title')}
                subtitle={t('settings.developers.breez.subtitle')}
                onPress={() => router.push('/settings/developers/breez-sdk')}
                testID="settings-breez-sdk"
              />
            </SettingsSection>

            <SettingsSection>
              <SettingsItem icon="information-circle-outline" title={t('settings.aboutApp')} onPress={() => router.push('/settings/about')} testID="settings-about" />
              <SettingsItem icon="help-buoy-outline" title={t('settings.help')} onPress={() => router.push('/need-help')} testID="settings-help" />
            </SettingsSection>

            <SettingsSection>
              <SettingsItem icon="log-out-outline" title={t('settings.signOut')} onPress={signOut} tone="danger" testID="settings-logout" />
            </SettingsSection>

            <Text testID="settings-version" className={`mt-8 text-center text-xs ${theme.textMuted}`}>
              {t('about.version', { version: Env.VERSION })}
            </Text>
            <LogoutBottomSheet ref={logoutModalRef} onLogout={resetWallet} hasSeedBackup={isSeedPhraseBackup} onBackupSeed={redirectToBackupSeedPhrase} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
  },
});
