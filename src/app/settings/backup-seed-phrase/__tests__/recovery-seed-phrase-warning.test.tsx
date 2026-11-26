import '@/lib/i18n';

import React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import MnemonicWarning from '../recovery-seed-phrase-warning';

// Stable, like expo-router's (a singleton)
const mockRouter = { push: jest.fn(), dismissAll: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => mockRouter,
    Stack: { Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</> },
  };
});

jest.mock('@/lib/stack-screen-options', () => ({ useStackScreenOptions: () => ({}) }));
jest.mock('@/components/ui/focus-aware-status-bar', () => ({ FocusAwareStatusBar: () => null }));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('Recovery Phrase warning screen (backup-seed-phrase/recovery-seed-phrase-warning)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<MnemonicWarning />);
  });

  afterEach(cleanup);

  it('announces the recovery phrase and that only the user holds the funds', () => {
    expect(screen.getByTestId('recovery-warning-intro')).toHaveTextContent('We are going to display your wallet recovery phrase on the next screen.');
    // Decorative: hidden from screen readers
    expect(screen.getByTestId('recovery-warning-placeholder', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByTestId('recovery-warning-important')).toHaveTextContent(
      'IMPORTANT: Grimm App does not have access to the funds in your wallet. You have sole custody of your wallet via the recovery phrase. If you lose your recovery phrase, Grimm App will not be able to restore your funds.',
    );
  });

  it('"I understand, back up my wallet" opens the recovery phrase', () => {
    fireEvent.press(screen.getByTestId('proceed-button'));

    expect(mockRouter.push).toHaveBeenCalledWith('/settings/backup-seed-phrase/recovery-seed-phrase');
  });

  it('"Cancel, I’ll do this later" goes back home', () => {
    fireEvent.press(screen.getByTestId('cancel-button'));

    expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});
