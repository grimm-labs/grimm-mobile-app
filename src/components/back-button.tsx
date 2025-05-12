import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';

import { colors } from '@/components/ui';

interface BackButtonProps {
  color?: string;
  size?: number;
  className?: string;
}

export const BackButton = memo(({ color = colors.success[600], size = 24, className = 'mr-4' }: BackButtonProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.back()} className={className}>
      <Ionicons name="arrow-back-outline" size={size} color={color} />
    </TouchableOpacity>
  );
});

export const HeaderLeft = () => <BackButton />;
