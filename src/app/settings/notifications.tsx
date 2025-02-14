import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { FocusAwareStatusBar, Pressable, Switch, Text, View } from '@/ui';

interface NotificationOptionProps {
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
}

const NotificationOption: React.FC<NotificationOptionProps> = ({ title, description, isEnabled, onToggle }) => (
  <Pressable>
    <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
      <View className="flex-1">
        <Text className="text-sm font-medium">{title}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
      <Switch.Root checked={isEnabled} onChange={onToggle} accessibilityLabel="switch" className="pb-2">
        <Switch.Icon checked={isEnabled} />
      </Switch.Root>
    </View>
  </Pressable>
);

export default function NotificationSettingsScreen() {
  const [notifications, setNotifications] = useState({
    productAnnouncements: false,
    walletActivity: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Notifications',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mt-6">
          <NotificationOption title="Product Announcements" description="New features and promotions" isEnabled={notifications.productAnnouncements} onToggle={() => toggleNotification('productAnnouncements')} />
          <NotificationOption title="Wallet Activity" description="Send, receive Bitcoin" isEnabled={notifications.walletActivity} onToggle={() => toggleNotification('walletActivity')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
