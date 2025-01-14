import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';

import { FocusAwareStatusBar, Text, View } from '@/ui';

export default function NotificationsScreen() {
  return (
    <SafeAreaView>
      <View className="flex h-full">
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mb-6 flex-1">
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name="balloon-outline"
              size={60}
              color="gray"
              className="mb-8"
            />
            <Text className="text-base text-gray-500">
              Circulate, there is nothing to show
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
