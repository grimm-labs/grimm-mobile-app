import React from 'react';
import { Linking } from 'react-native';

import { cleanup, screen, setup } from '@/lib/test-utils';

import NeedHelp from '../need-help';

const mockPush = jest.fn();
const mockBack = jest.fn();

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

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

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
      back: mockBack,
    }),
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

describe('NeedHelp screen', () => {
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    mockPush.mockClear();
    mockBack.mockClear();
    openURLSpy.mockRestore();
  });

  it('renders all support and service hours sections', () => {
    setup(<NeedHelp />);

    expect(screen.getByTestId('need-help-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-content')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-support-items')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-item-call')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-item-email')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-item-facebook')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-item-linkedin')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-item-twitter')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-service-hours')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-service-hours-title')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-hours-mon-fri-label')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-hours-mon-fri-value')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-hours-saturday-label')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-hours-saturday-value')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-hours-sunday-label')).toBeOnTheScreen();
    expect(screen.getByTestId('need-help-hours-sunday-value')).toBeOnTheScreen();
  });

  it('opens call link when tapping call support item', async () => {
    const { user } = setup(<NeedHelp />);

    await user.press(screen.getByTestId('need-help-item-call'));

    expect(openURLSpy).toHaveBeenCalledWith('tel:+237692279214');
  });

  it('opens email link when tapping email support item', async () => {
    const { user } = setup(<NeedHelp />);

    await user.press(screen.getByTestId('need-help-item-email'));

    expect(openURLSpy).toHaveBeenCalledWith('mailto:support@usegrimm.app?subject=Support Request');
  });
});
