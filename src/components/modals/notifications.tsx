import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  onClose: () => void;
};

export const NotificationsModal = ({ onClose }: Props) => {
  return (
    <View className="m-4 flex-1 bg-white">
      <View className="flex flex-row items-center">
        <Ionicons name="close" size={24} color="gray" onPress={onClose} />
        <View className="flex-1">
          <Text className="text-center text-base font-medium text-neutral-500">
            Notifications
          </Text>
        </View>
        <Ionicons
          name="checkmark-done"
          size={24}
          color="gray"
          onPress={onClose}
        />
      </View>
      {/* Network Selector */}
    </View>
  );
};
