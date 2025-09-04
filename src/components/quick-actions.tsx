import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Text, TouchableOpacity, View } from '@/components/ui';

type Action = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  onPress: () => void;
};

export const QuickActions = () => {
  const { t } = useTranslation();

  const actions: Action[] = [
    { label: t('quickActions.sendMoney'), icon: <Ionicons name="cash" size={22} color="white" />, bg: 'bg-success-600', onPress: () => console.log('Send Money') },
    { label: t('quickActions.airtime'), icon: <Ionicons name="call" size={22} color="white" />, bg: 'bg-danger-600', onPress: () => console.log('Airtime') },
    { label: t('quickActions.internet'), icon: <Ionicons name="wifi" size={22} color="white" />, bg: 'bg-indigo-600', onPress: () => console.log('Internet') },
    { label: t('quickActions.cableTv'), icon: <Ionicons name="tv" size={22} color="white" />, bg: 'bg-sky-600', onPress: () => console.log('Cable TV') },
    { label: t('quickActions.electricity'), icon: <Ionicons name="flash" size={22} color="white" />, bg: 'bg-yellow-600', onPress: () => console.log('Electricity') },
    { label: t('quickActions.water'), icon: <Ionicons name="water" size={22} color="white" />, bg: 'bg-blue-600', onPress: () => console.log('Water') },
    { label: t('quickActions.merchant'), icon: <Ionicons name="storefront" size={22} color="white" />, bg: 'bg-teal-600', onPress: () => console.log('Merchant') },
    { label: t('quickActions.betting'), icon: <Ionicons name="football-sharp" size={18} color="white" />, bg: 'bg-purple-600', onPress: () => console.log('Betting') },
  ];

  return (
    <View className="mt-4 rounded-lg border border-neutral-200 bg-neutral-100 p-3">
      <View className="mb-3 flex flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-600">{t('quickActions.title')}</Text>
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
