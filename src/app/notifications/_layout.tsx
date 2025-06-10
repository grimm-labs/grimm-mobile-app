import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';

import { HeaderLeft } from '@/components/back-button';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export default function NotificationsScreen() {
  return (
    <SafeAreaView>
      <View className="flex h-full">
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            title: 'Notifications',
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <View className="mb-6 flex-1">
          <View className="flex-1 items-center justify-center">
            <Ionicons name="balloon-outline" size={60} color="gray" className="mb-8" />
            <Text className="text-base text-gray-500">Circulate, there is nothing to show</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
