/* eslint-disable max-lines-per-function */
import type { Payment, SdkEvent } from '@breeztech/react-native-breez-sdk-liquid';
import { addEventListener, connect, defaultConfig, disconnect, getInfo, LiquidNetwork, listPayments, removeEventListener, SdkEventVariant } from '@breeztech/react-native-breez-sdk-liquid';
import { Env } from '@env';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useSecureStorage } from '../hooks/use-secure-storage';

interface BreezState {
  isConnected: boolean;
  isSyncing: boolean;
  balance: number;
  error: string | null;
  isInitialized: boolean;
  payments: Payment[];
}

interface BreezContextType extends BreezState {
  initializeBreez: () => Promise<void>;
  refreshWalletInfo: () => Promise<void>;
  disconnectBreez: () => Promise<void>;
}

const initialState: BreezState = {
  isConnected: false,
  isSyncing: false,
  balance: 0,
  error: null,
  isInitialized: false,
  payments: [],
};

const BreezContext = createContext<BreezContextType | undefined>(undefined);

interface BreezProviderProps {
  children: ReactNode;
  mnemonic?: string;
}

export const BreezProvider: React.FC<BreezProviderProps> = ({ children }) => {
  const [state, setState] = useState<BreezState>(initialState);
  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const eventListenerRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  const updateState = (updates: Partial<BreezState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const eventHandler = (event: SdkEvent) => {
    console.log('Breez event:', event);

    switch (event.type) {
      case SdkEventVariant.PAYMENT_SUCCEEDED:
        refreshWalletInfo();
        break;
      case SdkEventVariant.PAYMENT_FAILED:
        console.error('Payment failed:', event);
        break;
      case SdkEventVariant.SYNCED:
        updateState({ isSyncing: false });
        // Use setState with callback to get updated state
        setState((currentState) => {
          if (currentState.isConnected && currentState.isInitialized) {
            // Don't call refreshWalletInfo directly here to avoid loops
            // The function will be called from the main event handler
            setTimeout(() => refreshWalletInfoWithCurrentState(), 0);
          }
          return { ...currentState, isSyncing: false };
        });
        break;
      default:
        break;
    }
  };

  const initializeBreez = async (): Promise<void> => {
    if (isInitializingRef.current || state.isInitialized) {
      console.log('Breez already initialized or initialization in progress');
      return;
    }

    try {
      isInitializingRef.current = true;
      updateState({ isSyncing: true, error: null });

      let seedPhrase = null;
      if (!seedPhrase) {
        seedPhrase = await _getSeedPhrase();
      }

      if (!seedPhrase) {
        throw new Error('No recovery phrase found');
      }

      // Default configuration
      const config = await defaultConfig(LiquidNetwork.TESTNET, Env.BREEZ_API_KEY);
      console.log('Breez config:', config);

      try {
        await connect({ config, mnemonic: seedPhrase });
        console.log('Breez connected successfully');
      } catch (error: any) {
        if (error?.message?.includes('Already initialized')) {
          console.log('Breez SDK already initialized, continuing...');
        } else {
          throw error;
        }
      }

      // Register event listener only if it doesn't already exist
      if (!eventListenerRef.current) {
        const listenerId = await addEventListener(eventHandler);
        eventListenerRef.current = listenerId;
        console.log('Event listener added:', listenerId);
      }

      updateState({
        isConnected: true,
        isInitialized: true,
        isSyncing: false, // Important: set to false after success
      });

      await refreshWalletInfo();
    } catch (error) {
      console.error('Error during Breez initialization:', error);
      updateState({
        error: error?.toString(),
        isSyncing: false,
        isConnected: false,
      });
    } finally {
      isInitializingRef.current = false;
    }
  };

  const refreshWalletInfo = async (): Promise<void> => {
    try {
      // Use reference to current state instead of state
      const currentState = state;

      // STOP if not connected or not initialized
      if (!currentState.isConnected || !currentState.isInitialized) {
        console.log('Stopping refreshWalletInfo: not connected or not initialized');
        return;
      }

      // Check if seed phrase still exists
      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) {
        console.log('Seed phrase deleted, automatic disconnection');
        await disconnectBreez();
        return;
      }

      const getInfoRes = await getInfo();
      console.log('Wallet information:', getInfoRes);

      // Get payment history
      const payments = await listPayments({});

      updateState({
        balance: getInfoRes.walletInfo.balanceSat || 0,
        isSyncing: false,
        payments: payments || [],
      });
    } catch (error) {
      console.error('Error retrieving information:', error);
      updateState({ error: error?.toString() });
    }
  };

  // Enhanced version of refreshWalletInfo that uses current state
  const refreshWalletInfoWithCurrentState = async (): Promise<void> => {
    return new Promise((resolve) => {
      setState((currentState) => {
        // Execute refresh logic only if connected and initialized
        if (currentState.isConnected && currentState.isInitialized) {
          // Execute async function
          (async () => {
            try {
              const seedPhrase = await _getSeedPhrase();
              if (!seedPhrase) {
                console.log('Seed phrase deleted, automatic disconnection');
                await disconnectBreez();
                resolve();
                return;
              }

              const getInfoRes = await getInfo();
              console.log('Wallet information:', getInfoRes);

              const payments = await listPayments({});

              updateState({
                balance: getInfoRes.walletInfo.balanceSat || 0,
                isSyncing: false,
                payments: payments || [],
              });

              resolve();
            } catch (error) {
              console.error('Error retrieving information:', error);
              updateState({ error: error?.toString() });
              resolve();
            }
          })();
        } else {
          console.log('Stopping refreshWalletInfo: not connected or not initialized');
          resolve();
        }

        return currentState;
      });
    });
  };

  const disconnectBreez = async (): Promise<void> => {
    try {
      console.log('Disconnecting from Breez...');

      // Remove event listener
      if (eventListenerRef.current) {
        await removeEventListener(eventListenerRef.current);
        eventListenerRef.current = null;
        console.log('Event listener removed');
      }

      // Disconnect from SDK
      await disconnect();
      console.log('Disconnected from Breez SDK');

      // Reset state
      updateState({
        isConnected: false,
        isSyncing: false,
        balance: 0,
        error: null,
        isInitialized: false,
        payments: [],
      });

      // Reset initialization flag
      isInitializingRef.current = false;
    } catch (error) {
      console.error('Error during disconnection:', error);
      updateState({ error: error?.toString() });
    }
  };

  useEffect(() => {
    // Cleanup function to remove event listeners on unmount
    return () => {
      if (eventListenerRef.current) {
        removeEventListener(eventListenerRef.current).catch(console.error);
      }
    };
  }, []);

  const contextValue: BreezContextType = {
    ...state,
    initializeBreez,
    refreshWalletInfo: refreshWalletInfoWithCurrentState,
    disconnectBreez,
  };

  return <BreezContext.Provider value={contextValue}>{children}</BreezContext.Provider>;
};

export const useBreez = (): BreezContextType => {
  const context = useContext(BreezContext);
  if (context === undefined) {
    throw new Error('useBreez must be used within a BreezProvider');
  }
  return context;
};
