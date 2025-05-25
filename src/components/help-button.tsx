import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { colors } from '@/components/ui';

const HelpButton = memo(() => {
  const router = useRouter();

  const handleHelpPress = () => {
    router.push('/need-help');
  };

  return (
    <TouchableOpacity onPress={handleHelpPress}>
      <Ionicons name="chatbubble-ellipses" size={24} color={colors.neutral[400]} />
      <View className="absolute -right-0.5 -top-1 size-3 items-center justify-center rounded-full bg-primary-600" />
    </TouchableOpacity>
  );
});

export default HelpButton;
