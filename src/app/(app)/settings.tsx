/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LogoutBottomSheet } from '@/components/logout-bottom-sheet';
import { SettingsItem } from '@/components/settings-item';
import { FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Switch, Text, View } from '@/components/ui';
import { AppContext, useBdk } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';

export default function Settings() {
  const { t } = useTranslation();
  const { setSeedPhrase, resetAppData, isSeedPhraseBackup, hideBalance, setHideBalance } = useContext(AppContext);
  const { disconnectBreez } = useBreez();
  const { disconnectBdk } = useBdk();
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

  const handleLogout = async () => {
    await setSeedPhrase('');
    await resetAppData();
    await disconnectBreez();
    await disconnectBdk();
    router.push('/');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <FocusAwareStatusBar style="dark" />
        <View className="flex">
          <View className="flex border-b border-neutral-100 px-4 py-3">
            <Text className="text-2xl font-bold text-gray-800">{t('settings.title')}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* General Section */}
            <View className="mb-6 mt-3">
              <Text className="mx-4 mb-3 text-lg font-bold uppercase text-gray-700">{t('settings.sections.general')}</Text>
              <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
                <SettingsItem icon="build" title={t('settings.general.networks.title')} subtitle={t('settings.general.networks.subtitle')} onPress={() => router.push('/settings/network')} />
                <SettingsItem icon="globe" title={t('settings.general.country.title')} subtitle={t('settings.general.country.subtitle')} onPress={() => router.push('/settings/country')} />
                <SettingsItem icon="language" title={t('settings.general.language.title')} subtitle={t('settings.general.language.subtitle')} onPress={() => router.push('/settings/language')} />
                <SettingsItem icon="options-sharp" title={t('settings.general.bitcoinUnit.title')} subtitle={t('settings.general.bitcoinUnit.subtitle')} onPress={() => router.push('/settings/bitcoin-unit')} />
              </View>
            </View>

            {/* Security Section */}
            <View className="mb-6">
              <Text className="mx-4 mb-3 text-lg font-bold uppercase text-gray-600">{t('settings.sections.security')}</Text>
              <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
                {/* <SettingsItem icon="lock-closed" title={t('settings.security.pin.title')} subtitle={t('settings.security.pin.subtitle')} onPress={() => console.log('PIN change pressed')} /> */}
                <SettingsItem icon="key" title={t('settings.security.backup.title')} subtitle={t('settings.security.backup.subtitle')} onPress={redirectToBackupSeedPhrase} />
                {/* <Pressable className="mb-1 flex-row items-center rounded py-2">
                  <View className="mr-1 rounded-full p-2">
                    <Ionicons name="scan-sharp" size={20} color="gray" />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text className="text-base font-medium text-gray-800">{t('settings.security.faceId.title')}</Text>
                    <Text className="text-sm text-gray-500">{t('settings.security.faceId.subtitle')}</Text>
                  </View>
                  <View>
                    <Switch.Root checked={isFaceIdEnabled} onChange={setIsFaceIdEnabled} accessibilityLabel="switch" className="pb-2">
                      <Switch.Icon checked={isFaceIdEnabled} />
                    </Switch.Root>
                  </View>
                </Pressable> */}
                <Pressable className="mb-1 flex-row items-center rounded py-2" onPress={() => setHideBalance(!hideBalance)}>
                  <View className="mr-1 rounded-full p-2">
                    <Ionicons name="eye" size={20} color="gray" />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text className="text-base font-semibold text-gray-700">{t('settings.security.hideBalance.title')}</Text>
                    <Text className="text-xs text-gray-500">{t('settings.security.hideBalance.subtitle')}</Text>
                  </View>
                  <View>
                    <Switch.Root checked={hideBalance} onChange={setHideBalance} accessibilityLabel="switch" className="pb-2">
                      <Switch.Icon checked={hideBalance} />
                    </Switch.Root>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Preferences Section */}
            <View className="mb-6">
              <Text className="mx-4 mb-3 text-lg font-bold uppercase text-gray-600">{t('settings.sections.preferences')}</Text>
              <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
                <SettingsItem
                  icon="notifications"
                  title={t('settings.preferences.notifications.title')}
                  subtitle={t('settings.preferences.notifications.subtitle')}
                  onPress={() => router.push('/settings/notifications')}
                />
                <SettingsItem icon="color-palette" title={t('settings.preferences.appearance.title')} subtitle={t('settings.preferences.appearance.subtitle')} onPress={() => router.push('/settings/appearance')} />
              </View>
            </View>

            {/* Developers Section */}
            <View className="mb-6">
              <Text className="mx-4 mb-3 text-lg font-bold uppercase text-gray-600">{t('settings.sections.developers')}</Text>
              <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
                <SettingsItem icon="code-slash" title={t('settings.developers.breez.title')} subtitle={t('settings.developers.breez.subtitle')} onPress={() => router.push('/settings/developers/breez-sdk')} />
              </View>
            </View>

            {/* Help & Sign Out */}
            <View className="mx-4">
              <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4" onPress={() => router.push('/settings/about')}>
                <Text className="text-center font-bold text-gray-600">{t('settings.aboutApp')}</Text>
              </Pressable>
            </View>
            <View className="m-4">
              <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4" onPress={() => router.push('/need-help')}>
                <Text className="text-center font-bold text-primary-600">{t('settings.help')}</Text>
              </Pressable>
            </View>
            <View className="mx-4 mb-8">
              <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4" onPress={signOut}>
                <Text className="text-center font-bold text-red-600">{t('settings.signOut')}</Text>
              </Pressable>
            </View>
            <LogoutBottomSheet ref={logoutModalRef} onLogout={handleLogout} hasSeedBackup={isSeedPhraseBackup} onBackupSeed={redirectToBackupSeedPhrase} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
