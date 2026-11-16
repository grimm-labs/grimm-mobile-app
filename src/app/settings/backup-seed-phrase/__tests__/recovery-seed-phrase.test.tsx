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

const mockBack = jest.fn();
// Stable, like expo-router's (a singleton): the screen has the router in its effect deps
const mockRouter = { back: mockBack, push: jest.fn() };
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

/** App Lock on: cold start, unlock; the screen then asks again (Sensitive Action). */
async function openWithAppLockOn() {
  await seedAppLock({ pin: PIN });
  await startAppWithAppLock(<SeedPhraseScreen />);
  await enterPin(PIN);
  await flushPromises();
}

describe('Recovery Phrase screen (backup-seed-phrase/recovery-seed-phrase)', () => {
  let consoleSpy: ReturnType<typeof spyOnConsole>;

  beforeEach(() => {
    jest.clearAllMocks();
    fakeSecureStore.reset();
    fakeSecureStore.set('seedPhrase', RECOVERY_PHRASE);
    fakeLocalAuthentication.reset();
    consoleSpy = spyOnConsole();
  });

  afterEach(() => {
    cleanup();
    consoleSpy.expectNoSecretLogged([PIN, RECOVERY_PHRASE]);
    consoleSpy.restore();
  });

  it('App Lock on, prompt cancelled: goes back and never reads the Recovery Phrase', async () => {
    await openWithAppLockOn();
    expect(screen.getByTestId('lock-screen-cancel')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('lock-screen-cancel'));
    await flushPromises();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(recoveryPhraseWasRead()).toBe(false);
    expect(screen.queryByTestId('recovery-phrase-word-1')).not.toBeOnTheScreen();
  });

  it('App Lock on, right PIN in the prompt: shows the words', async () => {
    await openWithAppLockOn();
    expect(recoveryPhraseWasRead()).toBe(false);

    await enterPin(PIN);

    expect(screen.queryByTestId('lock-screen')).not.toBeOnTheScreen();
    expect(screen.getByTestId('recovery-phrase-word-1')).toHaveTextContent('abandon');
    expect(screen.getByTestId('recovery-phrase-word-12')).toHaveTextContent('accident');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('App Lock off, phone with a screen lock: phone authentication, then the words', async () => {
    fakeLocalAuthentication.willSucceed();

    await startAppWithAppLock(<SeedPhraseScreen />);
    await flushPromises();

    expect(fakeLocalAuthentication.promptOptions()).toEqual([expect.objectContaining({ disableDeviceFallback: false, biometricsSecurityLevel: 'strong' })]);
    expect(screen.getByTestId('recovery-phrase-word-1')).toHaveTextContent('abandon');
  });

  it('App Lock off, phone authentication failed: goes back and never reads the Recovery Phrase', async () => {
    fakeLocalAuthentication.willFail();

    await startAppWithAppLock(<SeedPhraseScreen />);
    await flushPromises();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(recoveryPhraseWasRead()).toBe(false);
    expect(screen.queryByTestId('recovery-phrase-word-1')).not.toBeOnTheScreen();
  });

  it('App Lock off, phone without a screen lock: the words without a prompt', async () => {
    fakeLocalAuthentication.removeScreenLock();

    await startAppWithAppLock(<SeedPhraseScreen />);
    await flushPromises();

    expect(fakeLocalAuthentication.promptOptions()).toEqual([]);
    expect(screen.getByTestId('recovery-phrase-word-1')).toHaveTextContent('abandon');
  });
});
