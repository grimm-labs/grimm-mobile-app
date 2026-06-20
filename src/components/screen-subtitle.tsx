import React from 'react';
import { twMerge } from 'tailwind-merge';

import { Text } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

export type ScreenSubtitleProps = {
  subtitle: string;
  className?: string;
};

export const ScreenSubtitle = ({ subtitle, className }: ScreenSubtitleProps) => {
  return (
    <Text testID="form-subtitle" className={twMerge('mb-3 text-base font-normal', theme.textSecondary, className)}>
      {subtitle}
    </Text>
  );
};
