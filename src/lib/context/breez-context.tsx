/* eslint-disable max-lines-per-function */
import type {
  Bolt11InvoiceDetails,
  BreezSdkInterface,
  DepositInfo,
  EventListener,
  GetInfoResponse,
  InputType,
  ListPaymentsRequest,
  LnurlAuthRequestDetails,
  LnurlCallbackStatus,
  LnurlPayRequestDetails,
  LnurlWithdrawRequestDetails,
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
  LnurlWithdrawRequest,
  Network,
  PaymentRequest,
  PaymentStatus,
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
import { AppState } from 'react-native';

import type { ClaimResult } from '../breez/deposits';
import { approvedClaimMaxFee, autoClaimMaxFee, claimErrorToResult, toClaimResult } from '../breez/deposits';
import { startSdkLogging } from '../breez/sdk-logs';
import { logUnclaimedDeposits } from '../breez/unclaimed-deposits-log';
import { paymentsFingerprint, syncSparkWallet } from '../breez/wallet-sync';
import { DEFAULT_LN_INVOICE_EXPIRY_SECS, GRIMM_APP_LN_URL_DOMAIN } from '../constant';
import { useSecureStorage } from '../hooks/use-secure-storage';
import { PAYMENT_COMPLETION_TIMEOUT_MS, waitWhilePending } from '../lightning/wait-for-payment';
import { toWithdrawRequest } from '../lightning/withdrawal-request';

export enum AppNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

const SYNC_INTERVAL = 10000;

const LIST_ALL_PAYMENTS: ListPaymentsRequest = {
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
  /** Asks Spark for a full sync (at most 30 s), then shows the balance and payments the SDK stored */
  refreshWalletInfo: () => Promise<void>;
  disconnectBreez: () => Promise<void>;
  setNetwork: (network: AppNetwork) => Promise<void>;
  getNetwork: () => AppNetwork;
  receiveBolt11: (description: string, amountSats?: number, expirySecs?: number) => Promise<ReceivePaymentResponse>;
  receiveBitcoinAddress: () => Promise<ReceivePaymentResponse>;
  parseInput: (input: string) => Promise<InputType>;
  prepareSend: (paymentRequest: string, amountSats?: number) => Promise<PrepareSendPaymentResponse>;
  /** `idempotencyKey` (a UUID): sending again with the same key never makes a second payment. */
  executeSend: (prepareResponse: PrepareSendPaymentResponse, idempotencyKey?: string) => Promise<SendPaymentResponse>;
  prepareLnurlPay: (amountSats: number, payRequest: LnurlPayRequestDetails) => Promise<PrepareLnurlPayResponse>;
  /** Waits up to 60 s for the payment to leave Pending (`lnurlPay` itself returns as soon as it starts). */
  executeLnurlPay: (prepareResponse: PrepareLnurlPayResponse, idempotencyKey?: string) => Promise<Payment | undefined>;
  /** Asks the service to pay an Invoice for the Amount; resolves with the Payment, or undefined if it is not received after 60 s */
  lnurlWithdraw: (amountSats: number, withdrawRequest: LnurlWithdrawRequestDetails) => Promise<Payment | undefined>;
  /** Lightning Login: signs the website's challenge with the identity derived for that domain */
  lnurlAuth: (requestData: LnurlAuthRequestDetails) => Promise<LnurlCallbackStatus>;
  unclaimedDeposits: DepositInfo[];
  listUnclaimedDeposits: () => Promise<DepositInfo[]>;
  refreshUnclaimedDeposits: () => Promise<DepositInfo[]>;
  /** Claims a deposit for at most the fee the user approved. Resolves with what the claim did; rejects only on an unexpected error. */
  claimDeposit: (txid: string, vout: number, maxFeeSats: bigint) => Promise<ClaimResult>;
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
  lnurlWithdraw: async () => {
    throw new Error('Breez not initialized');
  },
  lnurlAuth: async () => {
    throw new Error('Breez not initialized');
  },
  unclaimedDeposits: [],
  listUnclaimedDeposits: async () => {
    throw new Error('Breez not initialized');
  },
  refreshUnclaimedDeposits: async () => [],
  claimDeposit: async () => {
    throw new Error('Breez not initialized');
  },
};

const BreezContext = createContext<BreezContextType>(defaultContext);

interface BreezProviderProps {
  children: ReactNode;
}

type BreezEventHandlers = {
  onSynced: () => void;
  /** A payment succeeded, is pending or failed */
  onPaymentChanged: (event: SdkEvent) => void;
  onDepositsChanged: (event: SdkEvent) => void;
};

// Event listener implementation
class BreezEventListener implements EventListener {
  private handlers: BreezEventHandlers;

  constructor(handlers: BreezEventHandlers) {
    this.handlers = handlers;
  }

  async onEvent(event: SdkEvent): Promise<void> {
    switch (event.tag) {
      case SdkEvent_Tags.PaymentFailed:
        console.error('Payment failed:', event);
        this.handlers.onPaymentChanged(event);
        break;
      case SdkEvent_Tags.PaymentSucceeded:
      case SdkEvent_Tags.PaymentPending:
        this.handlers.onPaymentChanged(event);
        break;
      case SdkEvent_Tags.Synced:
        this.handlers.onSynced();
        break;
      case SdkEvent_Tags.UnclaimedDeposits:
      case SdkEvent_Tags.ClaimedDeposits:
      case SdkEvent_Tags.NewDeposits:
        this.handlers.onDepositsChanged(event);
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
  const [unclaimedDeposits, _setUnclaimedDeposits] = useState<DepositInfo[]>([]);

  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getNetwork, setItem: _updateNetwork } = useAsyncStorage('appNetwork');
  const { getItem: _getLnAddress, setItem: _setLnAddressStorage } = useAsyncStorage('lnAddress');
  const setLnAddressStorageRef = useRef(_setLnAddressStorage);
  setLnAddressStorageRef.current = _setLnAddressStorage;

  const sdkRef = useRef<BreezSdkInterface | null>(null);
  const eventListenerRef = useRef<string | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  // Reads of the stored wallet state can overlap (poll, SDK events, syncs): only the most recently started one may be shown
  const lastReadStartedRef = useRef(0);
  const lastReadShownRef = useRef(0);
  // null until the first read of the connected wallet
  const paymentsFingerprintRef = useRef<string | null>(null);
  // Callbacks used by the SDK event listener, the poll and the AppState listener, which outlive a render
  const readWalletStateRef = useRef<() => Promise<void>>(async () => {});
  const refreshWalletInfoRef = useRef<() => Promise<void>>(async () => {});
  const refreshUnclaimedDepositsRef = useRef<() => Promise<DepositInfo[]>>(async () => []);

  useEffect(() => {
    // Load the Lightning address from storage on startup
    const loadLnAddress = async () => {
      const stored = await _getLnAddress();
      if (stored) _setLightningAddress(stored);
    };
    loadLnAddress();
  }, [_getLnAddress]);

  useEffect(() => {
    let cancelled = false;
    const loadNetwork = async () => {
      try {
        const stored = await _getNetwork();
        if (!cancelled && (stored === AppNetwork.MAINNET || stored === AppNetwork.TESTNET)) {
          _setNetwork(stored);
        }
      } catch (error) {
        console.error('Error loading network from storage:', error);
      } finally {
        if (!cancelled) {
          _setIsDataLoaded(true);
        }
      }
    };
    loadNetwork();
    return () => {
      cancelled = true;
    };
  }, [_getNetwork]);

  const setLightningAddress = useCallback(async (address: string | null) => {
    _setLightningAddress(address);
    const persist = setLnAddressStorageRef.current;
    if (address) {
      await persist(address);
    } else {
      await persist('');
    }
  }, []);

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

      paymentsFingerprintRef.current = null;
      _setIsConnected(false);
      _setIsSyncing(false);
      _setBalance(0);
      _setBreezError(null);
      _setIsBreezInitialized(false);
      _setPayments([]);
      _setBreezWalletInfos(null);
      _setUnclaimedDeposits([]);
      setLightningAddress(null);
    } catch (error) {
      console.error('Error during Breez disconnection:', error);
      _setBreezError(error?.toString() || 'Disconnection error');
    }
  }, [setLightningAddress]);

  const listUnclaimedDeposits = useCallback(async (): Promise<DepositInfo[]> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    const response = await sdkRef.current.listUnclaimedDeposits({});
    return response.deposits;
  }, []);

  const refreshUnclaimedDeposits = useCallback(async (): Promise<DepositInfo[]> => {
    // The SDK ref, not the connection state: initializeBreez calls this right after connecting, before a render
    if (!sdkRef.current) {
      _setUnclaimedDeposits([]);
      return [];
    }

    try {
      const deposits = await listUnclaimedDeposits();
      _setUnclaimedDeposits(deposits);

      if (__DEV__) {
        logUnclaimedDeposits(deposits, 'refreshUnclaimedDeposits');
      }

      return deposits;
    } catch (error) {
      console.warn('[Breez SDK] Failed to refresh unclaimed deposits:', error);
      throw error;
    }
  }, [listUnclaimedDeposits]);

  /**
   * Shows the balance and payments that the SDK stored (no network call). The SDK updates them on its own
   * (payment events, a sync every minute), so a payment can show up while the stored balance is still the old one:
   * when a payment appears or changes status, this asks Spark for a sync, which corrects the balance.
   */
  const readWalletState = useCallback(async (): Promise<void> => {
    const sdk = sdkRef.current;
    if (!sdk) return;

    const readId = ++lastReadStartedRef.current;
    try {
      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) {
        await disconnectBreez();
        return;
      }

      const [info, paymentsList] = await Promise.all([sdk.getInfo({ ensureSynced: false }), sdk.listPayments(LIST_ALL_PAYMENTS)]);
      // A read that started earlier, or that read a wallet disconnected since, must not replace newer values
      if (sdkRef.current !== sdk || readId < lastReadShownRef.current) return;
      lastReadShownRef.current = readId;

      const storedPayments = paymentsList.payments || [];
      const fingerprint = paymentsFingerprint(storedPayments);
      const paymentsChanged = paymentsFingerprintRef.current !== null && paymentsFingerprintRef.current !== fingerprint;
      paymentsFingerprintRef.current = fingerprint;

      _setBreezWalletInfos(info);
      _setPayments(storedPayments);
      _setBalance(Number(info.balanceSats) || 0);

      if (paymentsChanged) {
        refreshWalletInfoRef.current().catch(console.error);
      }
    } catch (error) {
      console.error('Error reading wallet info:', error);
      _setBreezError(error?.toString() || 'Refresh error');
    }

    await refreshUnclaimedDepositsRef.current().catch(() => {});
  }, [_getSeedPhrase, disconnectBreez]);

  const refreshWalletInfo = useCallback(async (): Promise<void> => {
    const sdk = sdkRef.current;
    if (!sdk) return;

    _setIsSyncing(true);
    try {
      // The SDK batches syncs requested at the same time, so overlapping calls cost a single sync
      await syncSparkWallet(sdk);
      await readWalletState();
    } finally {
      _setIsSyncing(false);
    }
  }, [readWalletState]);

  readWalletStateRef.current = readWalletState;
  refreshWalletInfoRef.current = refreshWalletInfo;
  refreshUnclaimedDepositsRef.current = refreshUnclaimedDeposits;

  const claimDeposit = useCallback(
    async (txid: string, vout: number, maxFeeSats: bigint): Promise<ClaimResult> => {
      const sdk = sdkRef.current;
      if (!sdk) throw new Error('Breez SDK not initialized');

      let result: ClaimResult;
      try {
        result = toClaimResult(await sdk.claimDeposit({ txid, vout, maxFee: approvedClaimMaxFee(maxFeeSats) }));
      } catch (error) {
        const answer = claimErrorToResult(error);
        if (!answer) throw error;
        result = answer;
      }

      // The SDK updated the deposit (claimed, new fee, or claim in progress): show its stored state
      await refreshUnclaimedDeposits().catch(() => []);
      // A sync claims the incoming transfer and corrects the balance; it can take up to 30 s, so it does not hold the result
      refreshWalletInfo().catch(console.error);
      return result;
    },
    [refreshUnclaimedDeposits, refreshWalletInfo],
  );

  const receiveBolt11 = useCallback(async (description: string, amountSats?: number, expirySecs?: number): Promise<ReceivePaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.receivePayment({
      paymentMethod: ReceivePaymentMethod.Bolt11Invoice.new({
        description,
        amountSats: amountSats !== undefined ? BigInt(amountSats) : undefined,
        expirySecs: expirySecs ?? DEFAULT_LN_INVOICE_EXPIRY_SECS,
        paymentHash: undefined,
        receiverIdentityPublicKey: undefined,
        preimage: undefined,
      }),
    });
  }, []);

  const receiveBitcoinAddress = useCallback(async (): Promise<ReceivePaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.receivePayment({
      paymentMethod: new ReceivePaymentMethod.BitcoinAddress({ newAddress: true }),
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
        paymentRequest: new PaymentRequest.Input({ input: paymentRequest }),
        amount: amountSats !== undefined ? BigInt(amountSats) : undefined,
      }),
    );
  }, []);

  const executeSend = useCallback(async (prepareResponse: PrepareSendPaymentResponse, idempotencyKey?: string): Promise<SendPaymentResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');

    return sdkRef.current.sendPayment(
      SendPaymentRequest.new({
        prepareResponse,
        options: SendPaymentOptions.Bolt11Invoice.new({
          preferSpark: false,
          completionTimeoutSecs: PAYMENT_COMPLETION_TIMEOUT_MS / 1000,
        }),
        idempotencyKey,
      }),
    );
  }, []);

  const prepareLnurlPay = useCallback(async (amountSats: number, payRequest: LnurlPayRequestDetails): Promise<PrepareLnurlPayResponse> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    return sdkRef.current.prepareLnurlPay(
      PrepareLnurlPayRequest.new({
        amount: BigInt(amountSats),
        payRequest,
      }),
    );
  }, []);

  const executeLnurlPay = useCallback(async (prepareResponse: PrepareLnurlPayResponse, idempotencyKey?: string): Promise<Payment | undefined> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    const sdk = sdkRef.current;
    const response = await sdk.lnurlPay(
      LnurlPayRequest.new({
        prepareResponse,
        idempotencyKey,
      }),
    );
    // lnurlPay has no completion timeout: wait here like sendPayment does, so a send that completes in seconds is not shown as Pending
    return waitWhilePending({
      initial: response.payment,
      isPending: (payment) => payment.status === PaymentStatus.Pending,
      refresh: async (payment) => (await sdk.getPayment({ paymentId: payment.id })).payment,
    });
  }, []);

  const lnurlWithdraw = useCallback(async (amountSats: number, withdrawRequest: LnurlWithdrawRequestDetails): Promise<Payment | undefined> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    const response = await sdkRef.current.lnurlWithdraw(LnurlWithdrawRequest.new(toWithdrawRequest(amountSats, withdrawRequest)));
    return response.payment;
  }, []);

  const lnurlAuth = useCallback(async (requestData: LnurlAuthRequestDetails): Promise<LnurlCallbackStatus> => {
    if (!sdkRef.current) throw new Error('Breez SDK not initialized');
    return sdkRef.current.lnurlAuth(requestData);
  }, []);

  const initializeBreez = useCallback(async (): Promise<void> => {
    if (isInitializingRef.current || isBreezInitialized) return;

    try {
      isInitializingRef.current = true;
      _setIsSyncing(true);
      _setBreezError(null);

      const seedPhrase = await _getSeedPhrase();
      if (!seedPhrase) throw new Error('No recovery phrase found');

      // Before connecting, so the logs cover the SDK's startup sync and claims
      await startSdkLogging();

      const sparkNetwork = network === AppNetwork.MAINNET ? Network.Mainnet : Network.Regtest;
      const config = defaultConfig(sparkNetwork);
      config.apiKey = Env.BREEZ_API_KEY;
      config.lnurlDomain = GRIMM_APP_LN_URL_DOMAIN;
      config.maxDepositClaimFee = autoClaimMaxFee();

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
        const eventListener = new BreezEventListener({
          onSynced: () => {
            _setIsSyncing(false);
            // Read only: a sync here would emit Synced again
            setTimeout(() => readWalletStateRef.current().catch(console.error), 0);
          },
          onPaymentChanged: (event) => {
            readWalletStateRef.current().catch(console.error);
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
          onDepositsChanged: (event) => {
            refreshUnclaimedDepositsRef.current().catch(console.error);
            if (event.tag === SdkEvent_Tags.ClaimedDeposits) {
              readWalletStateRef.current().catch(console.error);
            }
          },
        });

        const listenerId = await sdkRef.current.addEventListener(eventListener);
        eventListenerRef.current = listenerId;
      }

      console.log(`Breez (Spark) connected successfully on ${network}`);
      _setIsConnected(true);
      _setIsBreezInitialized(true);
      _setIsSyncing(false);

      // Show the stored wallet state: the SDK syncs with Spark at startup, and its Synced event reads the result
      if (sdkRef.current) {
        await readWalletStateRef.current();
        // Load the Lightning address from the SDK and persist it
        try {
          const lnInfo = await sdkRef.current.getLightningAddress();
          if (lnInfo?.lightningAddress) {
            await setLightningAddress(lnInfo.lightningAddress);
          } else {
            await setLightningAddress(null);
          }
        } catch (e) {
          // Ignore if not set
        }

        await refreshUnclaimedDeposits();
      }
    } catch (error) {
      console.error('Error during Breez initialization:', error);
      _setBreezError(error?.toString() || 'Initialization error');
      _setIsSyncing(false);
      _setIsConnected(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [_getSeedPhrase, isBreezInitialized, network, router, setLightningAddress, refreshUnclaimedDeposits]);

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
    const syncInterval = setInterval(() => {
      readWalletStateRef.current().catch((err) => {
        console.error('Periodic Breez wallet refresh failed:', err);
      });
    }, SYNC_INTERVAL);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    // While the app was in the background, the SDK may have missed payments: sync with Spark on return
    let wasInBackground = false;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        wasInBackground = true;
      } else if (nextState === 'active' && wasInBackground) {
        wasInBackground = false;
        refreshWalletInfoRef.current().catch((err) => {
          console.error('Breez wallet sync on return to the app failed:', err);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
    lnurlWithdraw,
    lnurlAuth,
    unclaimedDeposits,
    listUnclaimedDeposits,
    refreshUnclaimedDeposits,
    claimDeposit,
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
export type {
  Bolt11InvoiceDetails,
  DepositInfo,
  GetInfoResponse,
  InputType,
  LnurlAuthRequestDetails,
  LnurlCallbackStatus,
  LnurlPayRequestDetails,
  LnurlWithdrawRequest,
  LnurlWithdrawRequestDetails,
  Payment,
  PrepareLnurlPayResponse,
  PrepareSendPaymentResponse,
  ReceivePaymentResponse,
  SendPaymentResponse,
};
export { BitcoinNetwork, InputType_Tags, LnurlCallbackStatus_Tags, PaymentStatus, PaymentType, SendPaymentMethod_Tags } from '@breeztech/breez-sdk-spark-react-native';
