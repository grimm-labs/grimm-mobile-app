/* eslint-disable max-lines-per-function */
import type {
  Bolt11InvoiceDetails,
  BreezSdkInterface,
  EventListener,
  GetInfoResponse,
  InputType,
  ListPaymentsRequest,
  LnurlPayRequestDetails,
  Payment,
  PrepareLnurlPayResponse,
  PrepareSendPaymentResponse,
  ReceivePaymentResponse,
  SdkEvent,
  SendPaymentResponse,
} from '@breeztech/breez-sdk-spark-react-native';
import {
  connect,
  defaultConfig,
  LnurlPayRequest,
  Network,
  PaymentType,
  PrepareLnurlPayRequest,
  PrepareSendPaymentRequest,
  ReceivePaymentMethod,
  SdkEvent_Tags,
  Seed,
  SendPaymentOptions,
  SendPaymentRequest,
} from '@breeztech/breez-sdk-spark-react-native';
import { Env } from '@env';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { GRIMM_APP_LN_URL_DOMAIN } from '../constant';
import { useSecureStorage } from '../hooks/use-secure-storage';

export enum AppNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

const SYNC_INTERVAL = 10000;

interface BreezContextType {
  isConnected: boolean;
  isSyncing: boolean;
  balance: number;
  breezError: string | null;
  isBreezInitialized: boolean;
  payments: Payment[];
  network: AppNetwork;
  breezWalletInfos: GetInfoResponse | null;
  isDataLoaded: boolean;
  lightningAddress: string | null;
  setLightningAddress: (address: string | null) => Promise<void>;
  checkLightningAddressAvailable: (username: string) => Promise<boolean>;
  registerLightningAddress: (username: string, description?: string) => Promise<any>;
  getLightningAddressInfo: () => Promise<any>;
  deleteLightningAddress: () => Promise<void>;
  initializeBreez: () => Promise<void>;
  refreshWalletInfo: () => Promise<void>;
  disconnectBreez: () => Promise<void>;
  setNetwork: (network: AppNetwork) => Promise<void>;
  getNetwork: () => AppNetwork;
  receiveBolt11: (description: string, amountSats?: number, expirySecs?: number) => Promise<ReceivePaymentResponse>;
  receiveBitcoinAddress: () => Promise<ReceivePaymentResponse>;
  parseInput: (input: string) => Promise<InputType>;
  prepareSend: (paymentRequest: string, amountSats?: number) => Promise<PrepareSendPaymentResponse>;
  executeSend: (prepareResponse: PrepareSendPaymentResponse) => Promise<SendPaymentResponse>;
  prepareLnurlPay: (amountSats: number, payRequest: LnurlPayRequestDetails) => Promise<PrepareLnurlPayResponse>;
  executeLnurlPay: (prepareResponse: PrepareLnurlPayResponse) => Promise<Payment | undefined>;
}

const defaultContext: BreezContextType = {
  isConnected: false,
  isSyncing: false,
  balance: 0,
  breezError: null,
  isBreezInitialized: false,
  payments: [],
  network: AppNetwork.MAINNET,
  breezWalletInfos: null,
  isDataLoaded: false,
  lightningAddress: null,
  setLightningAddress: async () => {},
  checkLightningAddressAvailable: async () => false,
  registerLightningAddress: async () => {
    throw new Error('Breez not initialized');
  },
  getLightningAddressInfo: async () => {
    throw new Error('Breez not initialized');
  },
  deleteLightningAddress: async () => {
    throw new Error('Breez not initialized');
  },
  initializeBreez: async () => {},
  refreshWalletInfo: async () => {},
  disconnectBreez: async () => {},
  setNetwork: async () => {},
  getNetwork: () => AppNetwork.MAINNET,
  receiveBolt11: async () => {
    throw new Error('Breez not initialized');
  },
  receiveBitcoinAddress: async () => {
    throw new Error('Breez not initialized');
  },
  parseInput: async () => {
    throw new Error('Breez not initialized');
  },
  prepareSend: async () => {
    throw new Error('Breez not initialized');
  },
  executeSend: async () => {
    throw new Error('Breez not initialized');
  },
  prepareLnurlPay: async () => {
    throw new Error('Breez not initialized');
  },
  executeLnurlPay: async () => {
    throw new Error('Breez not initialized');
  },
};

const BreezContext = createContext<BreezContextType>(defaultContext);

interface BreezProviderProps {
  children: ReactNode;
}

// Event listener implementation
class BreezEventListener implements EventListener {
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

export const BreezProvider: React.FC<BreezProviderProps> = ({ children }) => {
  const router = useRouter();

  const [isConnected, _setIsConnected] = useState(defaultContext.isConnected);
  const [isSyncing, _setIsSyncing] = useState(defaultContext.isSyncing);
  const [balance, _setBalance] = useState(defaultContext.balance);
  const [breezError, _setBreezError] = useState(defaultContext.breezError);
  const [isBreezInitialized, _setIsBreezInitialized] = useState(defaultContext.isBreezInitialized);
  const [payments, _setPayments] = useState<Payment[]>(defaultContext.payments);
  const [network, _setNetwork] = useState<AppNetwork>(AppNetwork.MAINNET);
  const [breezWalletInfos, _setBreezWalletInfos] = useState<GetInfoResponse | null>(defaultContext.breezWalletInfos);
  const [isDataLoaded, _setIsDataLoaded] = useState(defaultContext.isDataLoaded);
  const [lightningAddress, _setLightningAddress] = useState<string | null>(null);

  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getNetwork, setItem: _updateNetwork } = useAsyncStorage('appNetwork');
  const { getItem: _getLnAddress, setItem: _setLnAddressStorage } = useAsyncStorage('lnAddress');

  const sdkRef = useRef<BreezSdkInterface | null>(null);
  const eventListenerRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  useEffect(() => {
    // Load the Lightning address from storage on startup
    const loadLnAddress = async () => {
      const stored = await _getLnAddress();
      if (stored) _setLightningAddress(stored);
    };
    loadLnAddress();
  }, [_getLnAddress]);

  const setLightningAddress = useCallback(
    async (address: string | null) => {
      _setLightningAddress(address);
      if (address) {
        await _setLnAddressStorage(address);
      } else {
        await _setLnAddressStorage('');
      }
    },
    [_setLnAddressStorage],
  );

  const checkLightningAddressAvailable = useCallback(async (username: string): Promise<boolean> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    const available = await sdkRef.current.checkLightningAddressAvailable({ username });
    return available;
  }, []);

  const registerLightningAddress = useCallback(
    async (username: string, description?: string) => {
      if (!sdkRef.current) throw new Error('Breez SDK not initialized');
      const addressInfo = await sdkRef.current.registerLightningAddress({ username, description });
      if (addressInfo?.lightningAddress) {
        await setLightningAddress(addressInfo.lightningAddress);
      }
      return addressInfo;
    },
    [setLightningAddress],
  );

  const getLightningAddressInfo = useCallback(async () => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    const info = await sdkRef.current.getLightningAddress();
    if (info?.lightningAddress) {
      await setLightningAddress(info.lightningAddress);
    }
    return info;
  }, [setLightningAddress]);

  const deleteLightningAddress = useCallback(async () => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    await sdkRef.current.deleteLightningAddress();
    await setLightningAddress(null);
  }, [setLightningAddress]);

  const disconnectBreez = useCallback(async (): Promise<void> => {
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
      _setIsSyncing(true);
      if (!isConnected || !isBreezInitialized || !sdkRef.current) {
        _setIsSyncing(false);
        return;
      }

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) {
        await disconnectBreez();
        _setIsSyncing(false);
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

      _setBreezWalletInfos(info);
      _setPayments(paymentsList.payments || []);
      _setBalance(newBalance);
    } catch (error) {
      console.error('Error refreshing wallet info:', error);
      _setBreezError(error?.toString() || 'Refresh error');
    } finally {
      _setIsSyncing(false);
    }
  }, [_getSeedPhrase, disconnectBreez, isBreezInitialized, isConnected]);

  const receiveBolt11 = useCallback(async (description: string, amountSats?: number, expirySecs?: number): Promise<ReceivePaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.receivePayment({
      paymentMethod: ReceivePaymentMethod.Bolt11Invoice.new({
        description,
        amountSats: amountSats !== undefined ? BigInt(amountSats) : undefined,
        expirySecs: expirySecs ?? 3600,
      }),
    });
  }, []);

  const receiveBitcoinAddress = useCallback(async (): Promise<ReceivePaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.receivePayment({
      paymentMethod: new ReceivePaymentMethod.BitcoinAddress(),
    });
  }, []);

  const parseInput = useCallback(async (input: string): Promise<InputType> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    return sdkRef.current.parse(input);
  }, []);

  const prepareSend = useCallback(async (paymentRequest: string, amountSats?: number): Promise<PrepareSendPaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.prepareSendPayment(
      PrepareSendPaymentRequest.new({
        paymentRequest,
        amount: amountSats !== undefined ? BigInt(amountSats) : undefined,
      }),
    );
  }, []);

  const executeSend = useCallback(async (prepareResponse: PrepareSendPaymentResponse): Promise<SendPaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.sendPayment(
      SendPaymentRequest.new({
        prepareResponse,
        options: SendPaymentOptions.Bolt11Invoice.new({
          preferSpark: false,
          completionTimeoutSecs: 60,
        }),
      }),
    );
  }, []);

  const prepareLnurlPay = useCallback(async (amountSats: number, payRequest: LnurlPayRequestDetails): Promise<PrepareLnurlPayResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    return sdkRef.current.prepareLnurlPay(
      PrepareLnurlPayRequest.new({
        amountSats: BigInt(amountSats),
        payRequest,
      }),
    );
  }, []);

  const executeLnurlPay = useCallback(async (prepareResponse: PrepareLnurlPayResponse): Promise<Payment | undefined> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    const response = await sdkRef.current.lnurlPay(
      LnurlPayRequest.new({
        prepareResponse,
      }),
    );
    return response.payment;
  }, []);

  const initializeBreez = useCallback(async (): Promise<void> => {
    if (isInitializingRef.current || isBreezInitialized) return;

    try {
      isInitializingRef.current = true;
      _setIsSyncing(true);
      _setBreezError(null);

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) throw new Error('No recovery phrase found');

      const sparkNetwork = network === AppNetwork.MAINNET ? Network.Mainnet : Network.Regtest;
      const config = defaultConfig(sparkNetwork);
      config.apiKey = Env.BREEZ_API_KEY;
      config.lnurlDomain = GRIMM_APP_LN_URL_DOMAIN;

      // Get the storage directory path
      const baseDir = (FileSystem.documentDirectory || '').replace('file://', '');
      const storageDir = `${baseDir}spark-data`;

      // Ensure the storage directory exists
      const storageDirForExpo = `${FileSystem.documentDirectory}spark-data`;
      const dirInfo = await FileSystem.getInfoAsync(storageDirForExpo);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(storageDirForExpo, { intermediates: true });
      }

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
        const eventListener = new BreezEventListener(
          () => {
            _setIsSyncing(false);
            setTimeout(() => refreshWalletInfo(), 0);
          },
          (event) => {
            refreshWalletInfo();
            if (event.tag === SdkEvent_Tags.PaymentSucceeded) {
              const payment = (event as any).inner?.payment;
              if (payment && payment.paymentType === PaymentType.Receive) {
                const amountSat = Number(payment.amount) || 0;
                router.push({
                  pathname: '/transaction-result/success-screen',
                  params: { transactionType: 'received', satsAmount: amountSat.toString() },
                });
              }
            }
          },
          (event) => {
            console.error('Payment failed:', event);
          },
        );

        const listenerId = await sdkRef.current.addEventListener(eventListener);
        eventListenerRef.current = listenerId;
      }

      console.log(`Breez (Spark) connected successfully on ${network}`);
      _setIsConnected(true);
      _setIsBreezInitialized(true);
      _setIsSyncing(false);

      // Get initial wallet info
      if (sdkRef.current) {
        const info = await sdkRef.current.getInfo({ ensureSynced: false });
        const initialBalance = Number(info.balanceSats) || 0;
        _setBreezWalletInfos(info);
        _setBalance(initialBalance);
        // Load the Lightning address from the SDK and persist it
        try {
          const lnInfo = await sdkRef.current.getLightningAddress();
          if (lnInfo?.lightningAddress) {
            await setLightningAddress(lnInfo.lightningAddress);
          }
        } catch (e) {
          // Ignore if not set
        }
      }
    } catch (error) {
      console.error('Error during Breez initialization:', error);
      _setBreezError(error?.toString() || 'Initialization error');
      _setIsSyncing(false);
      _setIsConnected(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [_getSeedPhrase, refreshWalletInfo, isBreezInitialized, network, router, setLightningAddress]);

  useEffect(() => {
    // Cleanup: remove event listener on unmount
    return () => {
      if (sdkRef.current && eventListenerRef.current) {
        sdkRef.current.removeEventListener(eventListenerRef.current).catch(console.error);
      }
    };
  }, []);

  const setNetwork = useCallback(
    async (newNetwork: AppNetwork) => {
      try {
        await _updateNetwork(newNetwork);
        _setNetwork(newNetwork);
        await disconnectBreez();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await initializeBreez();
      } catch (e) {
        console.error(`[AsyncStorage] (network) Error saving data: ${e} [${newNetwork}]`);
        throw new Error('Error setting network');
      }
    },
    [_updateNetwork, disconnectBreez, initializeBreez],
  );

  const getNetwork = useCallback((): AppNetwork => {
    return network;
  }, [network]);

  useEffect(() => {
    // Periodically refresh wallet info
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
    network,
    breezWalletInfos,
    isDataLoaded,
    lightningAddress,
    setLightningAddress,
    checkLightningAddressAvailable,
    registerLightningAddress,
    getLightningAddressInfo,
    deleteLightningAddress,
    initializeBreez,
    refreshWalletInfo,
    disconnectBreez,
    setNetwork,
    getNetwork,
    receiveBolt11,
    receiveBitcoinAddress,
    parseInput,
    prepareSend,
    executeSend,
    prepareLnurlPay,
    executeLnurlPay,
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

// Re-export types and enums that consumers need
export type { Bolt11InvoiceDetails, GetInfoResponse, InputType, LnurlPayRequestDetails, Payment, PrepareLnurlPayResponse, PrepareSendPaymentResponse, ReceivePaymentResponse, SendPaymentResponse };
export { InputType_Tags, PaymentType, SendPaymentMethod_Tags } from '@breeztech/breez-sdk-spark-react-native';
