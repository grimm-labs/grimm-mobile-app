import React from 'react';
import { twMerge } from 'tailwind-merge';

import { Text } from '@/components/ui';

export type ScreenTitleProps = {
  title: string;
  className?: string;
};

export const ScreenTitle = ({ title, className }: ScreenTitleProps) => {
  return (
    <Text testID="form-title" className={twMerge('text-3xl font-normal my-3', className)}>
      {title}
    </Text>
  );
};
