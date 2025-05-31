import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export default function Sync() {
  return (
    <SafeAreaView className="flex-1">
      <View className="h-full flex-1 justify-between px-4">
        <Stack.Screen
          options={{
            headerShown: false,
            headerTitle: '',
            headerLeft: HeaderLeft,
            headerRight: () => null,
            headerShadowVisible: false,
          }}
        />

        <FocusAwareStatusBar style="dark" />

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={colors.primary[600]} className="mb-4" />
          <Text className="text-lg font-medium text-gray-500">Syncing...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
