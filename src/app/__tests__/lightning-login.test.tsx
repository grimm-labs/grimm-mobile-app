import React from 'react';
import { BackHandler } from 'react-native';

import { aLightningAddress, anLnurlAuth, anLnurlAuthError, anLnurlAuthOk } from '@/lib/payment-input/__tests__/helpers/breez-results';
import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import LightningLoginScreen from '../lightning-login';

const mockShowMessage = jest.fn();
// Refuses, like a cancelled PIN prompt: if the screen asked for the PIN, it would never sign in
const mockAuthorizeSensitiveAction = jest.fn(async () => false);
// Shows the interpolation values, so the tests can check what the screen puts in a message
const mockT = (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> };
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
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('@/lib/i18n', () => ({
  translate: (key: string) => key,
}));

jest.mock('react-native-flash-message', () => ({
  __esModule: true,
  default: () => null,
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
  hideMessage: jest.fn(),
}));

jest.mock('@/lib/context/app-lock-context', () => ({
  useAppLock: () => ({ authorizeSensitiveAction: mockAuthorizeSensitiveAction }),
}));

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

const LNURL = 'lnurl1dp68gurn8ghj7auth';
const DOMAIN = { domain: 'example.com' };

async function renderLogin() {
  fakeRouter.setParams({ paymentInput: LNURL });
  const view = render(<LightningLoginScreen />);
  await screen.findByTestId('lightning-login-confirm');
  return view;
}

const signIn = () => fireEvent.press(screen.getByTestId('lightning-login-confirm'));

const flash = (type: 'success' | 'danger') => mockShowMessage.mock.calls.filter(([options]) => options.type === type).map(([options]) => options.message);

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
  fakeBreez.parseInput.mockResolvedValue(anLnurlAuth({ domain: 'example.com', action: 'login' }));
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('LightningLoginScreen (lightning-login)', () => {
  describe('Confirmation (P4-1, P4-2)', () => {
    it('parses the Payment Input again with Breez, once Breez is started', async () => {
      fakeBreez.set({ isBreezInitialized: false });
      fakeRouter.setParams({ paymentInput: LNURL });
      render(<LightningLoginScreen />);

      expect(screen.getByTestId('lightning-login-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('lightning-login-confirm')).not.toBeOnTheScreen();
      expect(fakeBreez.parseInput).not.toHaveBeenCalled();

      act(() => fakeBreez.set({ isBreezInitialized: true }));

      expect(await screen.findByTestId('lightning-login-confirm')).toBeOnTheScreen();
      expect(fakeBreez.parseInput).toHaveBeenCalledWith(LNURL);
    });

    it.each([
      ['a failed parse', () => fakeBreez.parseInput.mockRejectedValue(new Error('invalid input'))],
      ['a parse result that is not LNURL-auth', () => fakeBreez.parseInput.mockResolvedValue(aLightningAddress())],
    ])('%s shows an error and no Sign in button', async (_case, arrange) => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      arrange();
      fakeRouter.setParams({ paymentInput: LNURL });
      render(<LightningLoginScreen />);

      expect(await screen.findByTestId('lightning-login-error')).toHaveTextContent('paymentInput.errors.unsupported');
      expect(screen.queryByTestId('lightning-login-confirm')).not.toBeOnTheScreen();
    });

    it.each([
      ['register', 'lightningLogin.title.register'],
      ['link', 'lightningLogin.title.link'],
      ['login', 'lightningLogin.title.signIn'],
      ['auth', 'lightningLogin.title.signIn'],
      [undefined, 'lightningLogin.title.signIn'],
      ['subscribe', 'lightningLogin.title.signIn'],
    ])('action %s: the title is %s', async (action, title) => {
      fakeBreez.parseInput.mockResolvedValue(anLnurlAuth({ domain: 'example.com', action }));
      await renderLogin();

      expect(screen.getByTestId('lightning-login-title')).toHaveTextContent(`${title} ${JSON.stringify(DOMAIN)}`);
    });

    it('shows the identity note with the domain, Sign in and Cancel', async () => {
      await renderLogin();

      expect(screen.getByText(`lightningLogin.note ${JSON.stringify(DOMAIN)}`)).toBeOnTheScreen();
      expect(screen.getByTestId('lightning-login-confirm')).toHaveTextContent('lightningLogin.confirm');
      expect(screen.getByTestId('lightning-login-cancel')).toHaveTextContent('lightningLogin.cancel');
    });
  });

  describe('Sign in only on a tap (P4-3)', () => {
    it('lnurlAuth is not called on mount', async () => {
      await renderLogin();
      await act(async () => {});

      expect(fakeBreez.lnurlAuth).not.toHaveBeenCalled();
    });

    it('Cancel goes back and never calls lnurlAuth', async () => {
      await renderLogin();

      fireEvent.press(screen.getByTestId('lightning-login-cancel'));

      expect(router.back).toHaveBeenCalledTimes(1);
      expect(fakeBreez.lnurlAuth).not.toHaveBeenCalled();
    });

    it('each tap on Sign in calls lnurlAuth exactly once, with the parsed request', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      let rejectAuth: (error: Error) => void = () => {};
      fakeBreez.lnurlAuth.mockReturnValueOnce(new Promise((_resolve, reject) => (rejectAuth = reject)));
      await renderLogin();
      const parsed = await fakeBreez.parseInput.mock.results[0].value;

      act(() => {
        signIn();
        signIn();
      });
      expect(fakeBreez.lnurlAuth).toHaveBeenCalledTimes(1);
      expect(fakeBreez.lnurlAuth).toHaveBeenCalledWith(parsed.inner[0]);
      expect(screen.getByTestId('lightning-login-confirm')).toBeDisabled();

      await act(async () => rejectAuth(new Error('timeout')));
      fakeBreez.lnurlAuth.mockResolvedValueOnce(anLnurlAuthOk());
      await act(async () => signIn());

      expect(fakeBreez.lnurlAuth).toHaveBeenCalledTimes(2);
    });
  });

  describe('Result (P4-4, P4-5)', () => {
    it("`Ok`: \"Signed in to {{domain}}\", then dismissAll and replace('/')", async () => {
      fakeBreez.lnurlAuth.mockResolvedValue(anLnurlAuthOk());
      await renderLogin();

      await act(async () => signIn());

      expect(flash('success')).toEqual([`lightningLogin.success ${JSON.stringify(DOMAIN)}`]);
      expect(router.dismissAll).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledWith('/');
      expect(router.dismissAll.mock.invocationCallOrder[0]).toBeLessThan(router.replace.mock.invocationCallOrder[0]);
    });

    it('`ErrorStatus`: "{{domain}} refused the sign-in: {{reason}}", stays on the screen', async () => {
      fakeBreez.lnurlAuth.mockResolvedValue(anLnurlAuthError('Unknown user'));
      await renderLogin();

      await act(async () => signIn());

      expect(flash('danger')).toEqual([`lightningLogin.errors.refused ${JSON.stringify({ domain: 'example.com', reason: 'Unknown user' })}`]);
      expect(flash('success')).toEqual([]);
      expect(router.replace).not.toHaveBeenCalled();
      expect(screen.getByTestId('lightning-login-confirm')).toBeEnabled();
    });

    it('an exception: "The sign-in could not be completed. Please try again.", stays on the screen', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.lnurlAuth.mockRejectedValue(new Error('network error'));
      await renderLogin();

      await act(async () => signIn());

      expect(flash('danger')).toEqual(['lightningLogin.errors.failed']);
      expect(router.replace).not.toHaveBeenCalled();
      expect(screen.getByTestId('lightning-login-confirm')).toBeEnabled();
    });

    it('a retry after an error calls lnurlAuth again', async () => {
      fakeBreez.lnurlAuth.mockResolvedValueOnce(anLnurlAuthError('Expired challenge')).mockResolvedValueOnce(anLnurlAuthOk());
      await renderLogin();

      await act(async () => signIn());
      await act(async () => signIn());

      expect(fakeBreez.lnurlAuth).toHaveBeenCalledTimes(2);
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('Review fixes (2026-11-16)', () => {
    function renderParsing() {
      fakeRouter.setParams({ paymentInput: LNURL });
      return render(<LightningLoginScreen />);
    }

    it('Breez could not start: "could not start" and a Back button, instead of a spinner that never ends', () => {
      fakeBreez.set({ isBreezInitialized: false, breezError: 'Initialization error' });
      renderParsing();

      expect(screen.getByTestId('lightning-login-error')).toHaveTextContent('paymentInput.errors.lightningFailed');
      fireEvent.press(screen.getByTestId('lightning-login-back'));
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it('a network error while reading the request says the website could not be reached', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.parseInput.mockRejectedValue(Object.assign(new Error('NetworkError'), { tag: 'NetworkError', inner: ['timeout'] }));
      renderParsing();

      expect(await screen.findByTestId('lightning-login-error')).toHaveTextContent('paymentInput.errors.unreachable');
    });

    it('the error view has a Back button; with nothing to go back to, it goes to the start', async () => {
      fakeBreez.parseInput.mockResolvedValue(aLightningAddress());
      router.canGoBack.mockReturnValueOnce(false);
      renderParsing();

      fireEvent.press(await screen.findByTestId('lightning-login-back'));

      expect(router.back).not.toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('a parse that succeeds after a failed one shows the request, not the old error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      fakeBreez.parseInput.mockRejectedValueOnce(new Error('invalid input'));
      renderParsing();
      expect(await screen.findByTestId('lightning-login-error')).toBeOnTheScreen();

      act(() => fakeBreez.set({ isBreezInitialized: false }));
      await act(async () => fakeBreez.set({ isBreezInitialized: true }));

      expect(await screen.findByTestId('lightning-login-confirm')).toBeOnTheScreen();
      expect(screen.queryByTestId('lightning-login-error')).not.toBeOnTheScreen();
    });

    it('`ErrorStatus` with no reason shows the generic message, never "refused the sign-in: "', async () => {
      fakeBreez.lnurlAuth.mockResolvedValue(anLnurlAuthError('   '));
      await renderLogin();

      await act(async () => signIn());

      expect(flash('danger')).toEqual(['lightningLogin.errors.failed']);
    });

    it('`ErrorStatus` with a very long reason shows it cut at 150 characters', async () => {
      fakeBreez.lnurlAuth.mockResolvedValue(anLnurlAuthError('x'.repeat(500)));
      await renderLogin();

      await act(async () => signIn());

      expect(flash('danger')).toEqual([`lightningLogin.errors.refused ${JSON.stringify({ domain: 'example.com', reason: `${'x'.repeat(150)}…` })}`]);
    });

    it('while signing in, the hardware back button waits (like Cancel)', async () => {
      const handlers: (() => boolean)[] = [];
      const addListener = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
        handlers.push(handler as () => boolean);
        return { remove: jest.fn() };
      });
      fakeBreez.lnurlAuth.mockReturnValue(new Promise(() => {}));
      await renderLogin();

      act(() => {
        signIn();
      });

      expect(handlers.some((handler) => handler() === true)).toBe(true);
      expect(screen.getByTestId('lightning-login-cancel')).toBeDisabled();
      addListener.mockRestore();
    });

    it('leaving while lnurlAuth runs: no flash and no navigation over wherever the user went', async () => {
      let finish: (status: unknown) => void = () => {};
      fakeBreez.lnurlAuth.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      const view = await renderLogin();

      act(() => {
        signIn();
      });
      view.unmount();
      finish(anLnurlAuthOk());
      await act(async () => {
        for (let i = 0; i < 20; i++) await Promise.resolve();
      });

      expect(mockShowMessage).not.toHaveBeenCalled();
      expect(router.dismissAll).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  it('is not a Sensitive Action: Sign in does not ask for the PIN (P4-6)', async () => {
    fakeBreez.lnurlAuth.mockResolvedValue(anLnurlAuthOk());
    await renderLogin();

    await act(async () => signIn());

    expect(mockAuthorizeSensitiveAction).not.toHaveBeenCalled();
    expect(fakeBreez.lnurlAuth).toHaveBeenCalledTimes(1);
  });
});
