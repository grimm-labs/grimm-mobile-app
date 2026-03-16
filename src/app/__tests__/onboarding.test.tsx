import React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

import Onboarding from '../onboarding';

const mockPush = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, testID, ...props }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID} {...props}>
        {children}
      </View>
    ),
    useSafeAreaInsets: () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => {
  const React = require('react');
  return {
    FocusAwareStatusBar: () => null,
  };
});

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
    }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

describe('Onboarding screen', () => {
  it('renders all main onboarding elements', () => {
    setup(<Onboarding />);

    expect(screen.getByTestId('onboarding-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-content')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-title')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-subtitle')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-get-started')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-get-started-label')).toHaveTextContent('onboarding.getStarted');
    expect(screen.getByTestId('onboarding-help')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-agreement-text')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-terms-text')).toBeOnTheScreen();
    expect(screen.getByTestId('onboarding-privacy-text')).toBeOnTheScreen();
  });

  it('navigates to create-or-import-seed when tapping get started', async () => {
    const { user } = setup(<Onboarding />);

    await user.press(screen.getByTestId('onboarding-get-started'));

    expect(mockPush).toHaveBeenCalledWith('/auth/create-or-import-seed');
  });

  it('navigates to need-help when tapping help button', async () => {
    const { user } = setup(<Onboarding />);

    await user.press(screen.getByTestId('onboarding-help'));

    expect(mockPush).toHaveBeenCalledWith('/need-help');
  });
});
