/* eslint-disable max-lines-per-function */
import type { PropsWithChildren } from 'react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

import type { RatesResponse } from '@/api';
import { useGetBitcoinPrice } from '@/api';

type DefaultContextType = {
  bitcoinPrices: RatesResponse | null;
};

const defaultContext: DefaultContextType = {
  bitcoinPrices: null,
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

    // Fetch price immediately
    fetchBitcoinPrice();

    // Start interval
    intervalRef.current = setInterval(() => {
      fetchBitcoinPrice();
    }, 20000);
  }, [fetchBitcoinPrice]);

  const stopPriceUpdates = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const wasInBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextAppState === 'active';
      const isGoingToBackground = nextAppState === 'background' || nextAppState === 'inactive';

      if (wasInBackground && isNowActive) {
        // App is back to foreground
        startPriceUpdates();
      } else if (isGoingToBackground) {
        // App going to background
        stopPriceUpdates();
      }

      appStateRef.current = nextAppState;
    };

    // Get the current app state
    const currentState = AppState.currentState;
    appStateRef.current = currentState;

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start updates only if app is active
    if (currentState === 'active') {
      startPriceUpdates();
    }

    return () => {
      stopPriceUpdates();
      subscription?.remove();
    };
  }, [startPriceUpdates, stopPriceUpdates]);

  const value = {
    bitcoinPrices,
  };

  return <BitcoinContext.Provider value={value}>{children}</BitcoinContext.Provider>;
};
