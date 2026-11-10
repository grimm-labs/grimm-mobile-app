jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import React from 'react';
import { Linking } from 'react-native';

import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeCamera } from '@/lib/payment-input/__tests__/helpers/fake-expo-camera';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import ScanQrScreen from '../_layout';

// The routing of the scanner is tested with the other entry points in src/lib/payment-input/__tests__/entry-points.test.tsx

const mockT = (key: string) => key;

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

jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('expo-camera', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-camera'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
  fakeCamera.reset();
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('ScanQrScreen (scan-qr)', () => {
  it('asks for the camera permission when it opens', async () => {
    render(<ScanQrScreen />);
    await act(async () => {});

    expect(fakeCamera.requestPermission).toHaveBeenCalled();
    expect(screen.getByTestId('scan-qr-instruction')).toBeOnTheScreen();
  });

  it('waits for the permission answer', async () => {
    fakeCamera.setPermission(null);
    render(<ScanQrScreen />);
    await act(async () => {});

    expect(screen.getByTestId('scan-qr-permission-required')).toBeOnTheScreen();
    expect(screen.queryByTestId('fake-camera')).not.toBeOnTheScreen();
  });

  it('without the permission, offers to open the settings', async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    fakeCamera.setPermission({ granted: false, status: 'denied', canAskAgain: false, expires: 'never' });
    render(<ScanQrScreen />);
    await act(async () => {});

    expect(screen.getByTestId('scan-qr-no-access')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByTestId('open-settings-button')));

    expect(openSettings).toHaveBeenCalled();
  });

  it('switches the camera, and offers the flash only with the back camera', async () => {
    render(<ScanQrScreen />);
    await act(async () => {});
    expect(fakeCamera.props().facing).toBe('back');

    fireEvent.press(screen.getByTestId('scan-qr-toggle-flash'));
    expect(fakeCamera.props().enableTorch).toBe(true);

    fireEvent.press(screen.getByTestId('scan-qr-flip-camera'));
    expect(fakeCamera.props().facing).toBe('front');
    expect(fakeCamera.props().enableTorch).toBe(false);
    expect(screen.queryByTestId('scan-qr-toggle-flash')).not.toBeOnTheScreen();
  });

  it("Close runs dismissAll then replace('/')", async () => {
    render(<ScanQrScreen />);
    await act(async () => {});

    fireEvent.press(screen.getByTestId('scan-qr-close'));

    expect(router.dismissAll).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.dismissAll.mock.invocationCallOrder[0]).toBeLessThan(router.replace.mock.invocationCallOrder[0]);
  });

  it('a second QR code while the first one is read is ignored', async () => {
    let resolveParse: (value: unknown) => void = () => {};
    fakeBreez.parseInput.mockReturnValue(new Promise((resolve) => (resolveParse = resolve)));
    render(<ScanQrScreen />);
    await act(async () => {});

    let firstScan: Promise<void> = Promise.resolve();
    act(() => {
      firstScan = fakeCamera.scan('alice@pay.usegrimm.app');
    });
    expect(fakeCamera.isScanning()).toBe(false);
    await act(() => fakeCamera.scan('bob@pay.usegrimm.app'));
    await act(async () => {
      resolveParse({ tag: 'LightningAddress', inner: [{ address: 'alice@pay.usegrimm.app', payRequest: {} }] });
      await firstScan;
    });

    expect(fakeBreez.parseInput).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
