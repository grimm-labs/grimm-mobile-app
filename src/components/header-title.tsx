import React from 'react';

import { Text, View } from '@/components/ui';

interface HeaderTitleProps {
  title: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export const HeaderTitle: React.FC<HeaderTitleProps> = ({ title, className = 'flex-row items-center', textClassName = 'text-normal', children }) => (
  <View className={className}>
    <Text className={textClassName}>{title}</Text>
    {children}
  </View>
);
