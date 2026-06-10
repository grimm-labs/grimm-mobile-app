import React from 'react';
import { AppState, Platform } from 'react-native';

import { PrivacyOverlay } from '@/components/privacy-overlay';
import { cleanup, render, screen, waitFor } from '@/lib/test-utils';
import { act } from '@testing-library/react-native';

const mockAppStateListeners = new Set<(state: string) => void>();
let mockColorScheme: 'light' | 'dark' = 'light';

const mockPreventScreenCaptureAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: (...args: unknown[]) => mockPreventScreenCaptureAsync(...args),
}));

jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: mockColorScheme,
    setColorScheme: jest.fn(),
  }),
  cssInterop: () => {},
}));

jest.mock('@/components/ui/image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Image: () => <View testID="privacy-overlay-logo" />,
  };
});

function emitAppState(state: string) {
  act(() => {
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: state });
    mockAppStateListeners.forEach((listener) => listener(state));
  });
}

describe('PrivacyOverlay', () => {
  const originalPlatform = Platform.OS;
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockColorScheme = 'light';
    mockAppStateListeners.clear();
    mockPreventScreenCaptureAsync.mockClear();
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });

    addEventListenerSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      mockAppStateListeners.add(listener as (state: string) => void);
      return {
        remove: () => {
          mockAppStateListeners.delete(listener as (state: string) => void);
        },
      };
    });
  });

  afterEach(() => {
    cleanup();
    addEventListenerSpy.mockRestore();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('does not render on web', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    render(<PrivacyOverlay />);

    expect(screen.queryByTestId('privacy-overlay')).not.toBeOnTheScreen();
    expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('shows overlay when app state becomes inactive on ios', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    render(<PrivacyOverlay />);

    emitAppState('inactive');

    await waitFor(() => {
      expect(screen.getByTestId('privacy-overlay')).toHaveStyle({ opacity: 1 });
    });
    expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();
  });

  it('shows overlay when app state becomes background on android', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    render(<PrivacyOverlay />);

    expect(mockPreventScreenCaptureAsync).not.toHaveBeenCalled();

    emitAppState('background');

    await waitFor(() => {
      expect(screen.getByTestId('privacy-overlay')).toBeOnTheScreen();
    });
  });

  it('hides overlay when app state becomes active on ios', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    render(<PrivacyOverlay />);

    emitAppState('inactive');
    await waitFor(() => {
      expect(screen.getByTestId('privacy-overlay')).toHaveStyle({ opacity: 1 });
    });

    emitAppState('active');

    await waitFor(() => {
      expect(screen.getByTestId('privacy-overlay')).toHaveStyle({ opacity: 0 });
    });
  });

  it('hides overlay when app state becomes active on android', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    render(<PrivacyOverlay />);

    emitAppState('background');
    await waitFor(() => {
      expect(screen.getByTestId('privacy-overlay')).toBeOnTheScreen();
    });

    emitAppState('active');

    await waitFor(() => {
      expect(screen.queryByTestId('privacy-overlay')).not.toBeOnTheScreen();
    });
  });

  it('uses light splash appearance by default', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    mockColorScheme = 'light';
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'inactive' });
    render(<PrivacyOverlay />);

    expect(screen.getByTestId('privacy-overlay')).toHaveStyle({ backgroundColor: '#ffffff' });
  });

  it('uses dark splash appearance when color scheme is dark', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    mockColorScheme = 'dark';
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'inactive' });
    render(<PrivacyOverlay />);

    expect(screen.getByTestId('privacy-overlay')).toHaveStyle({ backgroundColor: '#000000' });
  });
});
