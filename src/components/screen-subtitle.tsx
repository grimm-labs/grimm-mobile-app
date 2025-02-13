import React from 'react';
import { twMerge } from 'tailwind-merge';

import { Text } from '@/ui';

export type ScreenSubtitleProps = {
  subtitle: string;
  className?: string;
};

export const ScreenSubtitle = ({ subtitle, className }: ScreenSubtitleProps) => {
  return (
    <Text testID="form-subtitle" className={twMerge('text-lg font-medium', className)}>
      {subtitle}
    </Text>
  );
};
