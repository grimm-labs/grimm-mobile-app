import React from 'react';
import { Platform } from 'react-native';

import { ScreenCaptureGuard } from '@/components/screen-capture-guard';
import { AppContext } from '@/lib/context/app-context-provider';
import { cleanup, render, waitFor } from '@/lib/test-utils';
import { BitcoinUnit } from '@/types/enum';

const mockPreventScreenCaptureAsync = jest.fn().mockResolvedValue(undefined);
const mockAllowScreenCaptureAsync = jest.fn().mockResolvedValue(undefined);
const mockEnableAppSwitcherProtectionAsync = jest.fn().mockResolvedValue(undefined);
const mockDisableAppSwitcherProtectionAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: (...args: unknown[]) => mockPreventScreenCaptureAsync(...args),
  allowScreenCaptureAsync: (...args: unknown[]) => mockAllowScreenCaptureAsync(...args),
  enableAppSwitcherProtectionAsync: (...args: unknown[]) => mockEnableAppSwitcherProtectionAsync(...args),
  disableAppSwitcherProtectionAsync: (...args: unknown[]) => mockDisableAppSwitcherProtectionAsync(...args),
}));

function renderGuard(preventScreenCapture: boolean, isDataLoaded = true) {
  return render(
    <AppContext.Provider
      value={{
        preventScreenCapture,
        isDataLoaded,
        hideBalance: false,
        onboarding: false,
        hasSeedPhrase: false,
        isSeedPhraseBackup: false,
        selectedCountry: {
          currency: 'XAF',
          callingCode: '237',
          region: 'Africa',
          subregion: 'Middle Africa',
          name: 'Cameroon',
          nameFr: 'Cameroun',
          isoCode: 'CM',
        },
        bitcoinUnit: BitcoinUnit.Sats,
        setHideBalance: jest.fn(),
        setPreventScreenCapture: jest.fn(),
        setOnboarding: jest.fn(),
        resetAppData: jest.fn(),
        setSeedPhrase: jest.fn(),
        setIsSeedPhraseBackup: jest.fn(),
        setSelectedCountry: jest.fn(),
        setBitcoinUnit: jest.fn(),
      }}
    >
      <ScreenCaptureGuard />
    </AppContext.Provider>,
  );
}

describe('ScreenCaptureGuard', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    cleanup();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    mockPreventScreenCaptureAsync.mockClear();
    mockAllowScreenCaptureAsync.mockClear();
    mockEnableAppSwitcherProtectionAsync.mockClear();
    mockDisableAppSwitcherProtectionAsync.mockClear();
  });

  it('prevents screen capture when preference is enabled', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    renderGuard(true);

    await waitFor(() => {
      expect(mockPreventScreenCaptureAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockAllowScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('allows screen capture when preference is disabled on ios', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    renderGuard(false);

    await waitFor(() => {
      expect(mockAllowScreenCaptureAsync).toHaveBeenCalledTimes(1);
      expect(mockDisableAppSwitcherProtectionAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('allows screen capture on android when preference is disabled', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    renderGuard(false);

    await waitFor(() => {
      expect(mockAllowScreenCaptureAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('does nothing on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    renderGuard(true);

    await waitFor(() => {
      expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();
      expect(mockAllowScreenCaptureAsync).not.toHaveBeenCalled();
    });
  });

  it('does nothing until app data is loaded', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    renderGuard(true, false);

    await waitFor(() => {
      expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();
      expect(mockAllowScreenCaptureAsync).not.toHaveBeenCalled();
    });
  });

  it('enables app switcher protection on iOS when enabled', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    renderGuard(true);

    await waitFor(() => {
      expect(mockPreventScreenCaptureAsync).toHaveBeenCalledTimes(1);
      expect(mockEnableAppSwitcherProtectionAsync).toHaveBeenCalledTimes(1);
    });
  });
});
