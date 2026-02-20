/* eslint-disable max-lines-per-function */
import type { BreezSdkInterface, EventListener, GetInfoResponse, ListPaymentsRequest, Payment, ReceivePaymentResponse, SdkEvent } from '@breeztech/breez-sdk-spark-react-native';
import { connect, defaultConfig, Network, PaymentType, ReceivePaymentMethod, SdkEvent_Tags, Seed } from '@breeztech/breez-sdk-spark-react-native';
import { Env } from '@env';
import * as FileSystem from 'expo-file-system';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useSecureStorage } from '../hooks/use-secure-storage';

const SYNC_INTERVAL = 10000;

interface SparkContextType {
  isConnected: boolean;
  isSyncing: boolean;
  balance: number;
  sparkError: string | null;
  isSparkInitialized: boolean;
  sparkWalletInfos: GetInfoResponse | null;
  payments: Payment[];
  initializeSpark: () => Promise<void>;
  refreshWalletInfo: () => Promise<void>;
  disconnectSpark: () => Promise<void>;
  receiveBolt11: (description: string, amountSats?: number, expirySecs?: number) => Promise<ReceivePaymentResponse>;
  receiveBitcoinAddress: () => Promise<ReceivePaymentResponse>;
}

const defaultContext: SparkContextType = {
  isConnected: false,
  isSyncing: false,
  balance: 0,
  sparkError: null,
  isSparkInitialized: false,
  sparkWalletInfos: null,
  payments: [],
  initializeSpark: async () => {},
  refreshWalletInfo: async () => {},
  disconnectSpark: async () => {},
  receiveBolt11: async () => {
    throw new Error('Spark not initialized');
  },
  receiveBitcoinAddress: async () => {
    throw new Error('Spark not initialized');
  },
};

const SparkContext = createContext<SparkContextType>(defaultContext);

interface SparkProviderProps {
  children: ReactNode;
}

// Event listener implementation
class SparkEventListener implements EventListener {
  private onSynced: () => void;
  private onPaymentSucceeded: (event: SdkEvent) => void;
  private onPaymentFailed: (event: SdkEvent) => void;

  constructor(onSynced: () => void, onPaymentSucceeded: (event: SdkEvent) => void, onPaymentFailed: (event: SdkEvent) => void) {
    this.onSynced = onSynced;
    this.onPaymentSucceeded = onPaymentSucceeded;
    this.onPaymentFailed = onPaymentFailed;
  }

  async onEvent(event: SdkEvent): Promise<void> {
    switch (event.tag) {
      case SdkEvent_Tags.PaymentSucceeded:
        console.log('Payment succeeded:', event);
        this.onPaymentSucceeded(event);
        break;
      case SdkEvent_Tags.PaymentFailed:
        console.error('Payment failed:', event);
        this.onPaymentFailed(event);
        break;
      case SdkEvent_Tags.Synced:
        this.onSynced();
        break;
      default:
        break;
    }
  }
}

export const SparkProvider: React.FC<SparkProviderProps> = ({ children }) => {
  const [isConnected, _setIsConnected] = useState(defaultContext.isConnected);
  const [isSyncing, _setIsSyncing] = useState(defaultContext.isSyncing);
  const [balance, _setBalance] = useState(defaultContext.balance);
  const [sparkError, _setSparkError] = useState(defaultContext.sparkError);
  const [isSparkInitialized, _setIsSparkInitialized] = useState(defaultContext.isSparkInitialized);
  const [sparkWalletInfos, _setSparkWalletInfos] = useState<GetInfoResponse | null>(defaultContext.sparkWalletInfos);
  const [payments, _setPayments] = useState<Payment[]>(defaultContext.payments);

  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');

  const sdkRef = useRef<BreezSdkInterface | null>(null);
  const eventListenerRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  const disconnectSpark = useCallback(async (): Promise<void> => {
    try {
      if (sdkRef.current) {
        if (eventListenerRef.current) {
          await sdkRef.current.removeEventListener(eventListenerRef.current);
          eventListenerRef.current = null;
        }

        await sdkRef.current.disconnect();
        sdkRef.current = null;
      }

      _setIsConnected(false);
      _setIsSyncing(false);
      _setBalance(0);
      _setSparkError(null);
      _setIsSparkInitialized(false);
      _setSparkWalletInfos(null);
      _setPayments([]);
    } catch (error) {
      console.error('Error during Spark disconnection:', error);
      _setSparkError(error?.toString() || 'Disconnection error');
    }
  }, []);

  const refreshWalletInfo = useCallback(async (): Promise<void> => {
    try {
      if (!isConnected || !isSparkInitialized || !sdkRef.current) return;

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) {
        await disconnectSpark();
        return;
      }

      const info = await sdkRef.current.getInfo({ ensureSynced: false });
      const listPaymentsRequest: ListPaymentsRequest = {
        typeFilter: [PaymentType.Send, PaymentType.Receive],
        statusFilter: undefined,
        assetFilter: undefined,
        paymentDetailsFilter: undefined,
        fromTimestamp: undefined,
        toTimestamp: undefined,
        offset: undefined,
        limit: undefined,
        sortAscending: undefined,
      };
      const paymentsList = await sdkRef.current.listPayments(listPaymentsRequest);
      const newBalance = Number(info.balanceSats) || 0;

      _setSparkWalletInfos(info);
      _setBalance(newBalance);
      _setPayments(paymentsList.payments || []);
    } catch (error) {
      console.error('Error refreshing wallet info:', error);
      _setSparkError(error?.toString() || 'Refresh error');
    }
  }, [_getSeedPhrase, disconnectSpark, isSparkInitialized, isConnected]);

  const receiveBolt11 = useCallback(async (description: string, amountSats?: number, expirySecs?: number): Promise<ReceivePaymentResponse> => {
    if (!sdkRef.current) throw new Error('Spark SDK not initialized');

    const response = await sdkRef.current.receivePayment({
      paymentMethod: ReceivePaymentMethod.Bolt11Invoice.new({
        description,
        amountSats: amountSats !== undefined ? BigInt(amountSats) : undefined,
        expirySecs: expirySecs ?? 3600,
      }),
    });

    return response;
  }, []);

  const receiveBitcoinAddress = useCallback(async (): Promise<ReceivePaymentResponse> => {
    if (!sdkRef.current) throw new Error('Spark SDK not initialized');

    const response = await sdkRef.current.receivePayment({
      paymentMethod: ReceivePaymentMethod.BitcoinAddress.new(),
    });

    return response;
  }, []);

  const initializeSpark = useCallback(async (): Promise<void> => {
    if (isInitializingRef.current || isSparkInitialized) return;

    try {
      isInitializingRef.current = true;
      _setIsSyncing(true);
      _setSparkError(null);

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) throw new Error('No recovery phrase found');

      // Create the default config for Spark SDK
      const config = defaultConfig(Network.Mainnet);
      config.apiKey = Env.BREEZ_API_KEY;

      // Get the storage directory path
      // Remove file:// prefix as the SDK expects a native path (like RNFS.DocumentDirectoryPath)
      const baseDir = (FileSystem.documentDirectory || '').replace('file://', '');
      const storageDir = `${baseDir}spark-data`;

      console.log('Spark storage directory:', storageDir);

      // Ensure the storage directory exists (using path with file:// for expo-file-system)
      const storageDirForExpo = `${FileSystem.documentDirectory}spark-data`;
      const dirInfo = await FileSystem.getInfoAsync(storageDirForExpo);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(storageDirForExpo, { intermediates: true });
        console.log('Created Spark storage directory');
      }

      // Create the seed using Seed.Mnemonic factory
      const seed = Seed.Mnemonic.new({
        mnemonic: seedPhrase,
        passphrase: undefined,
      });

      try {
        const sdk = await connect({
          config,
          seed,
          storageDir,
        });
        sdkRef.current = sdk;
      } catch (error: any) {
        if (!error?.message?.includes('Already initialized')) throw error;
      }

      if (sdkRef.current && !eventListenerRef.current) {
        const eventListener = new SparkEventListener(
          () => {
            _setIsSyncing(false);
            setTimeout(() => refreshWalletInfo(), 0);
          },
          () => {
            refreshWalletInfo();
          },
          (event) => {
            console.error('Payment failed:', event);
          },
        );

        const listenerId = await sdkRef.current.addEventListener(eventListener);
        eventListenerRef.current = listenerId;
      }

      console.log('Spark SDK connected successfully');
      _setIsConnected(true);
      _setIsSparkInitialized(true);
      _setIsSyncing(false);

      // Get initial wallet info
      if (sdkRef.current) {
        const info = await sdkRef.current.getInfo({ ensureSynced: false });
        const initialBalance = Number(info.balanceSats) || 0;
        _setSparkWalletInfos(info);
        _setBalance(initialBalance);
      }
    } catch (error) {
      console.error('Error during Spark initialization:', error);
      _setSparkError(error?.toString() || 'Initialization error');
      _setIsSyncing(false);
      _setIsConnected(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [_getSeedPhrase, refreshWalletInfo, isSparkInitialized]);

  useEffect(() => {
    return () => {
      if (sdkRef.current && eventListenerRef.current) {
        sdkRef.current.removeEventListener(eventListenerRef.current).catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      await refreshWalletInfo();
    }, SYNC_INTERVAL);

    return () => {
      console.log('Stopping automatic synchronization');
      clearInterval(syncInterval);
    };
  }, [refreshWalletInfo]);

  const contextValue: SparkContextType = {
    isConnected,
    isSyncing,
    balance,
    sparkError,
    isSparkInitialized,
    sparkWalletInfos,
    payments,
    initializeSpark,
    refreshWalletInfo,
    disconnectSpark,
    receiveBolt11,
    receiveBitcoinAddress,
  };

  return <SparkContext.Provider value={contextValue}>{children}</SparkContext.Provider>;
};

export const useSpark = (): SparkContextType => {
  const context = useContext(SparkContext);
  if (context === undefined) {
    throw new Error('useSpark must be used within a SparkProvider');
  }
  return context;
};

/**
 * Safe hook to use Spark context with feature flag support
 * Returns null if USE_SPARK is false
 */
export const useSparkSafe = (): SparkContextType | null => {
  const context = useSpark();

  if (!Env.USE_SPARK) {
    return null;
  }

  return context;
};
