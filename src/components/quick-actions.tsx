import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { colors, Text, TouchableOpacity, View } from '@/ui';

type Action = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  onPress: () => void;
};

const actions: Action[] = [
  { label: 'Money', icon: <Ionicons name="cash" size={26} color="white" />, bg: 'bg-success-600', onPress: () => console.log('Send Money') },
  {
    label: 'Airtime',
    icon: <Ionicons name="call" size={26} color="white" />,
    onPress: () => console.log('Airtime'),
    bg: 'bg-danger-600',
  },
  {
    label: 'Internet',
    icon: <Ionicons name="wifi" size={26} color="white" />,
    onPress: () => console.log('Internet'),
    bg: 'bg-indigo-600',
  },
  {
    label: 'Cable TV',
    icon: <Ionicons name="tv" size={26} color="white" />,
    onPress: () => console.log('Cable TV'),
    bg: 'bg-sky-600',
  },
];

export const QuickActions = () => {
  return (
    <View className="rounded-lg bg-neutral-100 p-3">
      <View className="mb-6 flex flex-row items-center justify-between">
        <Text className="text-xl font-bold">Quick Actions</Text>
        <View className="flex flex-row items-center">
          <Text className="text-base font-medium text-success-600">More actions</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.success[600]} />
        </View>
      </View>
      <View className="rounded-lgp-4 flex-row justify-between">
        {actions.map((action, index) => (
          <TouchableOpacity key={index} className="flex w-20 items-center" onPress={action.onPress}>
            <View className={`rounded-full p-3 ${action.bg}`}>{action.icon}</View>
            <Text className="mt-2 text-center text-sm text-gray-700">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
