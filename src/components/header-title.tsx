import React from 'react';

import { Text, View } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

interface HeaderTitleProps {
  title: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export const HeaderTitle: React.FC<HeaderTitleProps> = ({ title, className = 'flex-row items-center', textClassName, children }) => (
  <View className={className}>
    <Text className={textClassName ?? theme.textPrimary}>{title}</Text>
    {children}
  </View>
);
