/* eslint-disable max-lines-per-function */
import type { PropsWithChildren } from 'react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

import type { RatesResponse } from '@/api';
import { useGetBitcoinPrice } from '@/api';

type DefaultContextType = {
  bitcoinPrices: RatesResponse;
};

const defaultContext: DefaultContextType = {
  bitcoinPrices: {
    xaf: 1,
    xof: 1,
    ngn: 1,
    kes: 1,
    usd: 1,
    eur: 1,
    mad: 1,
    timestamp: Date.now(),
  },
};

const BitcoinContext = createContext(defaultContext);

export const useBitcoin = () => {
  const context = useContext(BitcoinContext);
  if (!context) {
    throw new Error('useBitcoin must be used within a BitcoinPriceProvider');
  }
  return context;
};

type Props = PropsWithChildren<{}>;

export const BitcoinPriceProvider = ({ children }: Props) => {
  const [bitcoinPrices, setBitcoinPrices] = useState(defaultContext.bitcoinPrices);
  const { mutate: getBitcoinPrice } = useGetBitcoinPrice();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchBitcoinPrice = React.useCallback(() => {
    try {
      getBitcoinPrice(
        {},
        {
          onSuccess: (response) => {
            setBitcoinPrices(response);
          },
          onError: (error) => {
            console.error('Error fetching Bitcoin price:', error);
          },
        },
      );
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
    }
  }, [getBitcoinPrice]);

  const startPriceUpdates = React.useCallback(() => {
    // Clear the previous interval if it exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('Starting Bitcoin price updates');

    // Fetch price immediately
    fetchBitcoinPrice();

    // Start interval
    intervalRef.current = setInterval(() => {
      console.log('Auto-updating Bitcoin price');
      fetchBitcoinPrice();
    }, 20000);
  }, [fetchBitcoinPrice]);

  const stopPriceUpdates = React.useCallback(() => {
    console.log('Stopping Bitcoin price updates');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state change:', appStateRef.current, '->', nextAppState);

      const wasInBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextAppState === 'active';
      const isGoingToBackground = nextAppState === 'background' || nextAppState === 'inactive';

      if (wasInBackground && isNowActive) {
        // App is back to foreground
        console.log('App back to foreground - restarting updates');
        startPriceUpdates();
      } else if (isGoingToBackground) {
        // App going to background
        console.log('App in background - stopping updates');
        stopPriceUpdates();
      }

      appStateRef.current = nextAppState;
    };

    // Get the current app state
    const currentState = AppState.currentState;
    console.log('Initial app state:', currentState);
    appStateRef.current = currentState;

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start updates only if app is active
    if (currentState === 'active') {
      startPriceUpdates();
    }

    return () => {
      console.log('Cleaning up Bitcoin provider');
      stopPriceUpdates();
      subscription?.remove();
    };
  }, [startPriceUpdates, stopPriceUpdates]);

  const value = {
    bitcoinPrices,
  };

  return <BitcoinContext.Provider value={value}>{children}</BitcoinContext.Provider>;
};
