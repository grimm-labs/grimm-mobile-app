/* eslint-disable max-lines-per-function */
import type { GetInfoResponse, Payment, SdkEvent } from '@breeztech/react-native-breez-sdk-liquid';
import { addEventListener, connect, defaultConfig, disconnect, getInfo, LiquidNetwork, listPayments, PaymentType, removeEventListener, SdkEventVariant } from '@breeztech/react-native-breez-sdk-liquid';
import { Env } from '@env';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useSecureStorage } from '../hooks/use-secure-storage';

interface BreezState {
  isConnected: boolean;
  isSyncing: boolean;
  balance: number;
  error: string | null;
  isBreezInitialized: boolean;
  payments: Payment[];
  liquidNetwork: LiquidNetwork;
  breezWalletInfos: GetInfoResponse | null;
}

interface BreezContextType extends BreezState {
  initializeBreez: () => Promise<void>;
  refreshWalletInfo: () => Promise<void>;
  disconnectBreez: () => Promise<void>;
  setLiquidNetwork: (network: LiquidNetwork) => Promise<void>;
  getLiquidNetwork: () => LiquidNetwork;
}

const initialState: BreezState = {
  isConnected: false,
  isSyncing: false,
  balance: 0,
  error: null,
  isBreezInitialized: false,
  payments: [],
  liquidNetwork: LiquidNetwork.MAINNET,
  breezWalletInfos: null,
};

const BreezContext = createContext<BreezContextType | undefined>(undefined);

interface BreezProviderProps {
  children: ReactNode;
  mnemonic?: string;
}

export const BreezProvider: React.FC<BreezProviderProps> = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<BreezState>(initialState);
  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getLiquidNetwork, setItem: _setLiquidNetwork } = useAsyncStorage('liquidNetwork');
  const eventListenerRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  const updateState = (updates: Partial<BreezState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const eventHandler = (event: SdkEvent) => {
    console.log('Breez event:', event);

    switch (event.type) {
      case SdkEventVariant.PAYMENT_SUCCEEDED:
        const { amountSat, paymentType } = event.details;
        refreshWalletInfo();
        if (paymentType === PaymentType.RECEIVE) {
          router.push({
            pathname: '/transaction-result/success-screen',
            params: { transactionType: 'received', satsAmount: amountSat.toString() },
          });
        }
        break;
      case SdkEventVariant.PAYMENT_FAILED:
        console.error('Payment failed:', event);
        break;
      case SdkEventVariant.SYNCED:
        updateState({ isSyncing: false });
        // Use setState with callback to get updated state
        setState((currentState) => {
          if (currentState.isConnected && currentState.isBreezInitialized) {
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

  useEffect(() => {
    const loadLiquidNetwork = async (): Promise<LiquidNetwork> => {
      try {
        const storedNetwork = await _getLiquidNetwork();
        if (storedNetwork && Object.values(LiquidNetwork).includes(storedNetwork as LiquidNetwork)) {
          return storedNetwork as LiquidNetwork;
        }
        return LiquidNetwork.MAINNET;
      } catch (error) {
        console.error('Error loading liquid network:', error);
        return LiquidNetwork.TESTNET;
      }
    };

    const initializeNetwork = async () => {
      const network = await loadLiquidNetwork();
      updateState({ liquidNetwork: network });
    };
    initializeNetwork();
  }, [_getLiquidNetwork]);

  const initializeBreez = async (): Promise<void> => {
    if (isInitializingRef.current || state.isBreezInitialized) {
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

      const config = await defaultConfig(state.liquidNetwork, Env.BREEZ_API_KEY);

      try {
        await connect({ config, mnemonic: seedPhrase });
        console.log(`Breez connected successfully on ${state.liquidNetwork}`);
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
        isBreezInitialized: true,
        isSyncing: false,
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
      const currentState = state;

      // STOP if not connected or not initialized
      if (!currentState.isConnected || !currentState.isBreezInitialized) {
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
      setState((prevState) => ({ ...prevState, breezWalletInfos: getInfoRes }));

      const newBalance = getInfoRes.walletInfo.balanceSat || 0;
      setState((prevState) => ({ ...prevState, balance: newBalance }));

      // Get payment history
      const payments = await listPayments({});

      updateState({
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
        if (currentState.isConnected && currentState.isBreezInitialized) {
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
              if (getInfoRes) {
                // console.log('Wallet information:', getInfoRes);
                setState((prevState) => ({ ...prevState, breezWalletInfos: getInfoRes }));
              }

              const payments = await listPayments({});

              const newBalance = getInfoRes.walletInfo.balanceSat || 0;
              setState((prevState) => ({ ...prevState, balance: newBalance }));

              updateState({
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

      if (eventListenerRef.current) {
        await removeEventListener(eventListenerRef.current);
        eventListenerRef.current = null;
        console.log('Event listener removed');
      }

      await disconnect();
      console.log('Disconnected from Breez SDK');

      updateState({
        isConnected: false,
        isSyncing: false,
        balance: 0,
        error: null,
        isBreezInitialized: false,
        payments: [],
      });

      // Reset initialization flag
      isInitializingRef.current = false;
    } catch (error) {
      console.error('Error during disconnection:', error);
      updateState({ error: error?.toString() });
    }
  };

  const setLiquidNetwork = async (network: LiquidNetwork): Promise<void> => {
    if (network === state.liquidNetwork) {
      console.log('Network is already set to:', network);
      return;
    }

    try {
      console.log(`Changing network from ${state.liquidNetwork} to ${network}`);

      await _setLiquidNetwork(network);

      if (state.isConnected) {
        await disconnectBreez();
      }

      updateState({ liquidNetwork: network });

      setTimeout(async () => {
        await initializeBreez();
      }, 100);
    } catch (error) {
      console.error('Error changing liquid network:', error);
      updateState({ error: error?.toString() });
    }
  };

  const getLiquidNetwork = (): LiquidNetwork => {
    return state.liquidNetwork;
  };

  useEffect(() => {
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
    setLiquidNetwork,
    getLiquidNetwork,
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
