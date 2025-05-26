import React, { Stack } from 'expo-router';

import { HeaderLeft } from '@/components/back-button';
import { FocusAwareStatusBar, SafeAreaView, View } from '@/components/ui';

export default function CreateOrImportSeed() {
  return (
    <SafeAreaView>
      <View className="flex h-full pl-4">
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Create or Import Seed',
            headerLeft: HeaderLeft,
            headerRight: () => null,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar style="dark" />
      </View>
    </SafeAreaView>
  );
}
