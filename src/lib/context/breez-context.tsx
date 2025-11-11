/* eslint-disable max-lines-per-function */
import type { GetInfoResponse, ListPaymentsRequest, Payment, SdkEvent } from '@breeztech/react-native-breez-sdk-liquid';
import { addEventListener, connect, defaultConfig, disconnect, getInfo, LiquidNetwork, listPayments, PaymentType, removeEventListener, SdkEventVariant } from '@breeztech/react-native-breez-sdk-liquid';
import { Env } from '@env';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useSecureStorage } from '../hooks/use-secure-storage';

const SYNC_INTERVAL = 10000;

interface BreezContextType {
  isConnected: boolean;
  isSyncing: boolean;
  balance: number;
  breezError: string | null;
  isBreezInitialized: boolean;
  payments: Payment[];
  liquidNetwork: LiquidNetwork;
  breezWalletInfos: GetInfoResponse | null;
  isDataLoaded: boolean;
  initializeBreez: () => Promise<void>;
  refreshWalletInfo: () => Promise<void>;
  disconnectBreez: () => Promise<void>;
  setLiquidNetwork: (network: LiquidNetwork) => Promise<void>;
  getLiquidNetwork: () => LiquidNetwork;
}

const defaultContext: BreezContextType = {
  isConnected: false,
  isSyncing: false,
  balance: 0,
  breezError: null,
  isBreezInitialized: false,
  payments: [],
  liquidNetwork: LiquidNetwork.MAINNET,
  breezWalletInfos: null,
  isDataLoaded: false,
  initializeBreez: async () => {},
  refreshWalletInfo: async () => {},
  disconnectBreez: async () => {},
  setLiquidNetwork: async () => {},
  getLiquidNetwork: () => LiquidNetwork.MAINNET,
};

const BreezContext = createContext<BreezContextType>(defaultContext);

interface BreezProviderProps {
  children: ReactNode;
}

export const BreezProvider: React.FC<BreezProviderProps> = ({ children }) => {
  const router = useRouter();

  const [isConnected, _setIsConnected] = useState(defaultContext.isConnected);
  const [isSyncing, _setIsSyncing] = useState(defaultContext.isSyncing);
  const [balance, _setBalance] = useState(defaultContext.balance);
  const [breezError, _setBreezError] = useState(defaultContext.breezError);
  const [isBreezInitialized, _setIsBreezInitialized] = useState(defaultContext.isBreezInitialized);
  const [payments, _setPayments] = useState<Payment[]>(defaultContext.payments);
  const [liquidNetwork, _setLiquidNetwork] = useState<LiquidNetwork>(defaultContext.liquidNetwork);
  const [breezWalletInfos, _setBreezWalletInfos] = useState<GetInfoResponse | null>(defaultContext.breezWalletInfos);
  const [isDataLoaded, _setIsDataLoaded] = useState(defaultContext.isDataLoaded);

  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getLiquidNetwork, setItem: _updateLiquidNetwork } = useAsyncStorage('liquidNetwork');

  const eventListenerRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  const _loadLiquidNetwork = useCallback(async () => {
    const saved = await _getLiquidNetwork();
    if (saved !== null) {
      _setLiquidNetwork(saved as LiquidNetwork);
    }
  }, [_getLiquidNetwork]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await _loadLiquidNetwork();
      } catch (error) {
        console.error('[AsyncStorage] Error loading liquidNetwork:', error);
      } finally {
        _setIsDataLoaded(true);
      }
    };

    loadData();
  }, [_loadLiquidNetwork]);

  const disconnectBreez = useCallback(async (): Promise<void> => {
    try {
      if (eventListenerRef.current) {
        await removeEventListener(eventListenerRef.current);
        eventListenerRef.current = null;
      }

      await disconnect();

      _setIsConnected(false);
      _setIsSyncing(false);
      _setBalance(0);
      _setBreezError(null);
      _setIsBreezInitialized(false);
      _setPayments([]);
      _setBreezWalletInfos(null);
    } catch (error) {
      console.error('Error during Breez disconnection:', error);
      _setBreezError(error?.toString() || 'Disconnection error');
    }
  }, []);

  const refreshWalletInfo = useCallback(async (): Promise<void> => {
    try {
      if (!isConnected || !isBreezInitialized) return;

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) {
        await disconnectBreez();
        return;
      }

      const info = await getInfo();
      const listPaymentsRequest: ListPaymentsRequest = {};
      const paymentsList = await listPayments(listPaymentsRequest);
      const newBalance = info.walletInfo.balanceSat || 0;

      _setBreezWalletInfos(info);
      _setPayments(paymentsList || []);
      _setBalance(newBalance);
    } catch (error) {
      console.error('Error refreshing wallet info:', error);
      _setBreezError(error?.toString() || 'Refresh error');
    }
  }, [_getSeedPhrase, disconnectBreez, isBreezInitialized, isConnected]);

  const eventHandler = useCallback(
    (event: SdkEvent) => {
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
          _setIsSyncing(false);
          setTimeout(() => refreshWalletInfo(), 0);
          break;
        default:
          break;
      }
    },
    [refreshWalletInfo, router],
  );

  const initializeBreez = useCallback(async (): Promise<void> => {
    if (isInitializingRef.current || isBreezInitialized) return;

    try {
      isInitializingRef.current = true;
      _setIsSyncing(true);
      _setBreezError(null);

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) throw new Error('No recovery phrase found');

      const config = await defaultConfig(liquidNetwork, Env.BREEZ_API_KEY);

      try {
        await connect({ config, mnemonic: seedPhrase });
      } catch (error: any) {
        if (!error?.message?.includes('Already initialized')) throw error;
      }

      if (!eventListenerRef.current) {
        const listenerId = await addEventListener(eventHandler);
        eventListenerRef.current = listenerId;
      }

      console.log(`Breez connected successfully ${liquidNetwork}`);
      _setIsConnected(true);
      _setIsBreezInitialized(true);
      _setIsSyncing(false);

      await refreshWalletInfo();
    } catch (error) {
      console.error('Error during Breez initialization:', error);
      _setBreezError(error?.toString() || 'Initialization error');
      _setIsSyncing(false);
      _setIsConnected(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [_getSeedPhrase, eventHandler, refreshWalletInfo, isBreezInitialized, liquidNetwork]);

  useEffect(() => {
    return () => {
      if (eventListenerRef.current) {
        removeEventListener(eventListenerRef.current).catch(console.error);
      }
    };
  }, []);

  const setLiquidNetwork = useCallback(
    async (network: LiquidNetwork) => {
      try {
        await _updateLiquidNetwork(network);
        _setLiquidNetwork(network);
        await disconnectBreez();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await initializeBreez();
      } catch (e) {
        console.error(`[AsyncStorage] (liquidNetwork) Error saving data: ${e} [${network}]`);
        throw new Error('Error setting liquidNetwork');
      }
    },
    [_updateLiquidNetwork, disconnectBreez, initializeBreez],
  );

  const getLiquidNetwork = useCallback((): LiquidNetwork => {
    return liquidNetwork;
  }, [liquidNetwork]);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      await refreshWalletInfo();
    }, SYNC_INTERVAL);

    return () => {
      console.log('Stopping automatic synchronization');
      clearInterval(syncInterval);
    };
  }, [refreshWalletInfo]);

  const contextValue: BreezContextType = {
    isConnected,
    isSyncing,
    balance,
    breezError,
    isBreezInitialized,
    payments,
    liquidNetwork,
    breezWalletInfos,
    isDataLoaded,
    initializeBreez,
    refreshWalletInfo,
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
