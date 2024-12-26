/* eslint-disable max-lines-per-function */
import React from 'react';

import { SettingsItem } from '@/components/settings-item';
import {
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/ui';

export default function Settings() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex">
        <View className="flex border-b border-neutral-100 px-4 py-3">
          <FocusAwareStatusBar />
          <Text className="text-2xl font-bold text-gray-800">Settings</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="mb-6 mt-2">
            <Text className="mx-4 mb-3 text-base font-semibold text-gray-600">
              General
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 px-2 py-4">
              <SettingsItem
                icon="globe"
                title="Networks"
                subtitle="Manage and configure your networks"
                onPress={() => console.log('Networks pressed')}
              />

              <SettingsItem
                icon="language"
                title="Language"
                subtitle="Select your preferred app language"
                onPress={() => console.log('Language pressed')}
              />

              <SettingsItem
                icon="logo-euro"
                title="Currency"
                subtitle="Choose your default display currency"
                onPress={() => console.log('Currency pressed')}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="mx-4 mb-3 text-base font-semibold text-gray-600">
              Security
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
              <SettingsItem
                icon="lock-closed"
                title="Change PIN code"
                subtitle="Update your wallet access PIN"
                onPress={() => console.log('PIN change pressed')}
              />

              <SettingsItem
                icon="key"
                title="Backup Key"
                subtitle="Secure and manage your wallet recovery key"
                onPress={() => console.log('Backup Key pressed')}
              />

              <SettingsItem
                icon="finger-print"
                title="Enable Biometric Auth"
                subtitle="Use Face ID or Fingerprint for quick access"
                onPress={() => console.log('Biometric Auth pressed')}
              />
            </View>
          </View>
          <View className="mb-6">
            <Text className="mx-4 mb-3 text-base font-semibold text-gray-600">
              Preferences
            </Text>
            <View className="mx-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-2">
              <SettingsItem
                icon="notifications"
                title="Notifications"
                subtitle="Customize your app notification settings"
                onPress={() => console.log('Notifications pressed')}
              />

              <SettingsItem
                icon="color-palette"
                title="Appearance"
                subtitle="Switch between light and dark modes"
                onPress={() => console.log('Appearance pressed')}
              />

              <SettingsItem
                icon="shield"
                title="Privacy"
                subtitle="Manage data sharing and privacy controls"
                onPress={() => console.log('Privacy pressed')}
              />
            </View>
          </View>
          <View className="m-4">
            <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4">
              <Text className="text-center font-bold text-green-600">
                Help & Support
              </Text>
            </Pressable>
          </View>

          <View className="mx-4 mb-4">
            <Pressable className="rounded-xl border border-neutral-200 bg-neutral-100 p-4">
              <Text className="text-center font-bold text-red-600">
                Sign Out
              </Text>
            </Pressable>
          </View>

          <View className="mx-10 mb-6">
            <Text className="text-center text-base text-gray-700">
              Grimm App's <Text className="font-bold underline">Privacy</Text>,{' '}
              <Text className="font-bold underline">Terms</Text> and{' '}
              <Text className="font-bold underline">Open Source Software</Text>
            </Text>
          </View>
          <View className="mb-10">
            <Text className="text-center text-sm font-medium text-gray-500">
              Version 1.0.0 (0394859)
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
