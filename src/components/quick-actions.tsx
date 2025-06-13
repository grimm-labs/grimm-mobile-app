import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Text, TouchableOpacity, View } from '@/components/ui';

type Action = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  onPress: () => void;
};

const actions: Action[] = [
  { label: 'Money', icon: <Ionicons name="cash" size={18} color="white" />, bg: 'bg-success-600', onPress: () => console.log('Send Money') },
  { label: 'Airtime', icon: <Ionicons name="call" size={18} color="white" />, bg: 'bg-danger-600', onPress: () => console.log('Airtime') },
  { label: 'Internet', icon: <Ionicons name="wifi" size={18} color="white" />, bg: 'bg-indigo-600', onPress: () => console.log('Internet') },
  { label: 'Cable TV', icon: <Ionicons name="tv" size={18} color="white" />, bg: 'bg-sky-600', onPress: () => console.log('Cable TV') },
  { label: 'Electricity', icon: <Ionicons name="flash" size={18} color="white" />, bg: 'bg-yellow-600', onPress: () => console.log('Electricity') },
  { label: 'Water', icon: <Ionicons name="water" size={18} color="white" />, bg: 'bg-blue-600', onPress: () => console.log('Water') },
  { label: 'Merchant', icon: <Ionicons name="storefront" size={18} color="white" />, bg: 'bg-teal-600', onPress: () => console.log('Merchant') },
  { label: 'Betting', icon: <Ionicons name="football-sharp" size={18} color="white" />, bg: 'bg-purple-600', onPress: () => console.log('Betting') },
];

export const QuickActions = () => {
  return (
    <View className="mt-4 rounded-lg border border-neutral-200 bg-neutral-100 p-3">
      <View className="mb-3 flex flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-600">Quick Actions</Text>
      </View>
      <View className="flex flex-row flex-wrap justify-between">
        {actions.map((action, index) => (
          <TouchableOpacity key={index} className="w-1/4 items-center p-2" onPress={action.onPress}>
            <View className={`rounded-full p-3 ${action.bg}`}>{action.icon}</View>
            <Text className="mt-2 text-center text-xs text-gray-700">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
