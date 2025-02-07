import React from 'react';
import { twMerge } from 'tailwind-merge';

import { Text } from '@/ui';

export type ScreenTitleProps = {
  title: string;
  className?: string;
};

export const ScreenTitle = ({ title, className }: ScreenTitleProps) => {
  return (
    <Text testID="form-title" className={twMerge('text-2xl font-normal text-gray-600', className)}>
      {title}
    </Text>
  );
};
