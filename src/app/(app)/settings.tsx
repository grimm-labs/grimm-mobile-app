/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Alert } from 'react-native';

import { SettingsItem } from '@/components/settings-item';
import { FocusAwareStatusBar, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';

export default function Settings() {
  const { setSeedPhrase, resetAppData } = useContext(AppContext);
  const { disconnectBreez } = useBreez();
  const router = useRouter();

  const handleSignOut = async () => {
    setSeedPhrase('');
    resetAppData();
    await disconnectBreez();
    router.push('/');
  };

  const signOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        onPress: () => {
          handleSignOut();
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FocusAwareStatusBar style="dark" />
      <View className="flex">
        <View className="flex border-b border-neutral-100 px-4 py-3">
          <Text className="text-2xl font-bold text-gray-800">Settings</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="mb-6 mt-3">
            <Text className="mx-4 mb-3 text-xl font-semibold text-gray-600">General</Text>
            <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
              <SettingsItem icon="build" title="Networks" subtitle="Manage and configure your networks" onPress={() => router.push('/settings/network')} />
              <SettingsItem icon="globe" title="Country" subtitle="Select your country for a personalized experience" onPress={() => router.push('/settings/country')} />
              <SettingsItem icon="language" title="Language" subtitle="Select your preferred app language" onPress={() => router.push('/settings/language')} />
              <SettingsItem icon="options-sharp" title="Bitcoin Units" subtitle="Choose between BTC and SATS" onPress={() => router.push('/settings/bitcoin-unit')} />
            </View>
          </View>
          <View className="mb-6">
            <Text className="mx-4 mb-3 text-xl font-semibold text-gray-600">Security</Text>
            <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
              {/* <SettingsItem icon="lock-closed" title="Change PIN code" subtitle="Update your wallet access PIN" onPress={() => console.log('PIN change pressed')} /> */}
              <SettingsItem icon="key" title="Backup Key" subtitle="Secure and manage your wallet recovery key" onPress={() => router.push('/settings/recovery-phrase-warning')} />
              {/* <Pressable className="mb-1 flex-row items-center rounded py-2">
                <View className="mr-1 rounded-full p-2">
                  <Ionicons name="scan-sharp" size={20} color="gray" />
                </View>
                <View className="ml-2 flex-1">
                  <Text className="text-base font-medium text-gray-800">Enable Face ID</Text>
                  <Text className="text-sm text-gray-500">Use Face ID for quick access</Text>
                </View>
                <View>
                  <Switch.Root checked={isFadeIdEnabled} onChange={setIsFaceIdEnabled} accessibilityLabel="switch" className="pb-2">
                    <Switch.Icon checked={isFadeIdEnabled} />
                  </Switch.Root>
                </View>
              </Pressable> */}
            </View>
          </View>
          <View className="mb-6">
            <Text className="mx-4 mb-3 text-xl font-semibold text-gray-600">Preferences</Text>
            <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
              {/* <SettingsItem icon="notifications" title="Notifications" subtitle="Customize your app notification settings" onPress={() => router.push('/settings/notifications')} /> */}
              <SettingsItem icon="color-palette" title="Appearance" subtitle="Switch between light and dark modes" onPress={() => router.push('/settings/appearance')} />
            </View>
          </View>
          <View className="m-4">
            <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4" onPress={() => router.push('/need-help')}>
              <Text className="text-center font-bold text-primary-600">Help & Support</Text>
            </Pressable>
          </View>
          <View className="mx-4 mb-4">
            <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4" onPress={signOut}>
              <Text className="text-center font-bold text-red-600">Sign Out</Text>
            </Pressable>
          </View>
          <View className="mx-10 mb-6">
            <Text className="text-center text-base text-gray-700">
              Grimm Technologies's <Text className="font-semibold underline">Privacy</Text>, <Text className="font-semibold underline">Terms</Text> and{' '}
              <Text className="font-semibold underline">Open Source Software</Text>
            </Text>
          </View>
          <View className="mb-6">
            <Text className="text-center text-sm font-medium text-gray-500">Version 1.0.0 (0394859)</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
