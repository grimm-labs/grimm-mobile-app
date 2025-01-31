import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { FocusAwareStatusBar } from '@/ui';

const HomeHeader = () => {
  const router = useRouter();

  const [notificationCount, _setNotificationCount] = React.useState(10);

  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 px-4">
      <View className="flex  py-3">
        <FocusAwareStatusBar />
        <Text className="text-2xl font-bold text-gray-800">Home</Text>
      </View>
      <Pressable
        className="relative"
        onPress={() => router.push('notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color="gray" />
        {notificationCount > 0 && (
          <View className="absolute -right-0.5 -top-1 h-3 w-3 items-center justify-center rounded-full bg-green-600" />
        )}
      </Pressable>
    </View>
  );
};

export default HomeHeader;
