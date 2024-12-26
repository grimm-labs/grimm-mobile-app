import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { FocusAwareStatusBar } from '@/ui';

import { NotificationsModal } from './modals/notifications';

const HomeHeader = () => {
  const [notificationCount, _setNotificationCount] = React.useState(10);
  const [isNotificationModalOpen, setIsNotificationModalOpen] =
    React.useState(false);

  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 px-4">
      <View className="flex  py-3">
        <FocusAwareStatusBar />
        <Text className="text-2xl font-bold text-gray-800">Home</Text>
      </View>
      <Pressable
        className="relative"
        onPress={() => {
          // Logique de navigation vers les notifications
          console.log('Navigate to notifications');
        }}
      >
        <Ionicons
          name="notifications-outline"
          size={24}
          color="gray"
          onPress={() => setIsNotificationModalOpen(true)}
        />
        {notificationCount > 0 && (
          <View className="absolute -right-0.5 -top-1 h-3 w-3 items-center justify-center rounded-full bg-green-500" />
        )}
      </Pressable>
      <Modal
        visible={isNotificationModalOpen}
        onRequestClose={() => setIsNotificationModalOpen(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <NotificationsModal onClose={() => setIsNotificationModalOpen(false)} />
      </Modal>
    </View>
  );
};

export default HomeHeader;

<View className="flex border-b border-neutral-100 px-4 py-3">
  <FocusAwareStatusBar />
  <Text className="text-2xl font-bold text-gray-800">Settings</Text>
</View>;
