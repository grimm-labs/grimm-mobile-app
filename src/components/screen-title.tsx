import React from 'react';
import { twMerge } from 'tailwind-merge';

import { Text } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

export type ScreenTitleProps = {
  title: string;
  className?: string;
};

export const ScreenTitle = ({ title, className }: ScreenTitleProps) => {
  return (
    <Text testID="form-title" className={twMerge('my-2 text-3xl font-normal', theme.textPrimary, className)}>
      {title}
    </Text>
  );
};
