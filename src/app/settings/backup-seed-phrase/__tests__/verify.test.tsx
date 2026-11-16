jest.mock('expo-secure-store', () => require('@/lib/app-lock/__tests__/helpers/fake-secure-store'));
jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import '@/lib/i18n';

import React from 'react';

import { spyOnConsole } from '@/lib/app-lock/__tests__/helpers/console-spy';
import { fakeLocalAuthentication } from '@/lib/app-lock/__tests__/helpers/fake-local-authentication';
import { fakeSecureStore, getItemAsync } from '@/lib/app-lock/__tests__/helpers/fake-secure-store';
import { seedAppLock, startAppWithAppLock } from '@/lib/app-lock/__tests__/helpers/render-with-app-lock';
import { act, cleanup, fireEvent, screen } from '@/lib/test-utils';

import SeedPhraseScreen from '../recovery-seed-phrase';
import SeedPhraseVerificationScreen from '../verify';

const mockBack = jest.fn();
// Stable, like expo-router's (a singleton): the screen has the router in its effect deps
const mockRouter = { back: mockBack, push: jest.fn(), dismissAll: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => mockRouter,
    Stack: { Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</> },
  };
});

jest.mock('@/lib/context', () => ({
  AppContext: jest.requireActual('@/lib/context/app-context-provider').AppContext,
}));

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({ disconnectBreez: jest.fn() }),
}));

jest.mock('@/lib/context/bdk-context', () => ({
  useBdk: () => ({ disconnectBdk: jest.fn() }),
}));

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('react-native-flash-message', () => ({ showMessage: jest.fn() }));
jest.mock('@/lib/stack-screen-options', () => ({ useStackScreenOptions: () => ({}) }));
jest.mock('@/components/back-button', () => ({ HeaderLeft: () => null }));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: Record<string, unknown>) => <View {...props} />;
});

const PIN = '482915';
const RECOVERY_PHRASE = 'abandon ability able about above absent absorb abstract absurd abuse access accident';

async function flushPromises() {
  await act(async () => {
    for (let i = 0; i < 50; i++) await Promise.resolve();
  });
}

async function enterPin(pin: string) {
  for (const digit of pin) fireEvent.press(screen.getByTestId(`lock-screen-pin-pad-key-${digit}`));
  await flushPromises();
}

const recoveryPhraseWasRead = () => getItemAsync.mock.calls.some(([key]) => key === 'seedPhrase');

describe('Recovery Phrase verification screen (backup-seed-phrase/verify)', () => {
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(async () => {
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeSecureStore.set('seedPhrase', RECOVERY_PHRASE);
    fakeLocalAuthentication.reset();
    consoleSpy = spyOnConsole();
    await seedAppLock({ pin: PIN });
  });

  afterEach(() => {
    cleanup();
    consoleSpy.expectNoSecretLogged([PIN, RECOVERY_PHRASE]);
    consoleSpy.restore();
  });

  it('App Lock on: asks for authentication before reading the Recovery Phrase', async () => {
    await startAppWithAppLock(<SeedPhraseVerificationScreen />);
    await enterPin(PIN);

    expect(screen.getByTestId('lock-screen-cancel')).toBeOnTheScreen();
    expect(recoveryPhraseWasRead()).toBe(false);
    expect(screen.queryByTestId('verify-word-input-0')).not.toBeOnTheScreen();

    await enterPin(PIN);

    expect(recoveryPhraseWasRead()).toBe(true);
    expect(screen.getByTestId('verify-word-input-0')).toBeOnTheScreen();
  });

  it('prompt cancelled: goes back and never reads the Recovery Phrase', async () => {
    await startAppWithAppLock(<SeedPhraseVerificationScreen />);
    await enterPin(PIN);

    fireEvent.press(screen.getByTestId('lock-screen-cancel'));
    await flushPromises();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(recoveryPhraseWasRead()).toBe(false);
    expect(screen.queryByTestId('verify-word-input-0')).not.toBeOnTheScreen();
  });

  it('after the Recovery Phrase screen, one authentication covers both screens', async () => {
    const { rerenderScreen } = await startAppWithAppLock(<SeedPhraseScreen />);
    await enterPin(PIN);
    await enterPin(PIN);
    expect(screen.getByTestId('recovery-phrase-word-1')).toBeOnTheScreen();

    rerenderScreen(<SeedPhraseVerificationScreen />);
    await flushPromises();

    expect(screen.queryByTestId('lock-screen')).not.toBeOnTheScreen();
    expect(screen.getByTestId('verify-word-input-0')).toBeOnTheScreen();
  });
});
