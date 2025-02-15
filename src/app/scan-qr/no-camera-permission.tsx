import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView, View } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, FocusAwareStatusBar } from '@/ui';

export default function NoCameraPermission() {
  const router = useRouter();
  return (
    <SafeAreaView>
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: 'Scan QR',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="flex-1 items-center justify-center">
          <ScreenTitle title="No Camera Access" className="text-center text-2xl font-medium" />
          <View className="mb-4" />
          <ScreenSubtitle subtitle="Grimm App doesn't have access to the camera. Please enable camera access to scan QR codes." className="text-center" />
          <View className="mb-4" />
          <Button
            testID="login-button"
            label="Open Settings"
            variant="outline"
            className="mb-4"
            textClassName="text-base"
            onPress={async () => {
              await Linking.openURL('app-settings:');
            }}
            icon="cog"
          />
        </View>
        <View className="">
          <Button testID="login-button" label="Show Receive Address" variant="secondary" size="lg" textClassName="text-base" onPress={() => router.push('receive')} icon="qr-code" />
        </View>
      </View>
    </SafeAreaView>
  );
}
