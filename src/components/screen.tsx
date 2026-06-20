import React from 'react';
import { type Edge, SafeAreaProvider } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
  withSafeAreaProvider?: boolean;
};

export const Screen = ({ children, className, edges, withSafeAreaProvider = false }: ScreenProps) => {
  const content = (
    <SafeAreaView className={twMerge('flex-1', theme.screen, className)} edges={edges}>
      <FocusAwareStatusBar />
      {children}
    </SafeAreaView>
  );

  if (withSafeAreaProvider) {
    return <SafeAreaProvider>{content}</SafeAreaProvider>;
  }

  return content;
};
