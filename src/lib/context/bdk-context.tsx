/* eslint-disable max-lines-per-function */
import type { Blockchain, Wallet as BdkWallet } from 'bdk-rn';
import { Address, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, TxBuilder, Wallet } from 'bdk-rn';
import type { Balance, TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import { KeychainKind, Network } from 'bdk-rn/lib/lib/enums';
import * as FileSystem from 'expo-file-system';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { connectEsploraBackend, type EsploraServerOption, migrateLegacyServerId, orderEsploraServers, toEsploraServerOptions } from '../bdk-blockchain-connect';
import { DEFAULT_ESPLORA_SERVERS, DEFAULT_SERVER_ID } from '../constant';
import { useSecureStorage } from '../hooks/use-secure-storage';
import { getItem as getStorageItem, setItem as setStorageItem } from '../storage';
import { useBreez } from './breez-context';

export type { EsploraServerOption };

const SYNC_INTERVAL = 60000;
const INIT_RETRY_INTERVAL = 30000;

const SERVER_KEY_MAINNET = 'selectedEsploraServer_mainnet';
const SERVER_KEY_TESTNET = 'selectedEsploraServer_testnet';
const LEGACY_SERVER_KEY_MAINNET = 'selectedElectrumServer_mainnet';
const LEGACY_SERVER_KEY_TESTNET = 'selectedElectrumServer_testnet';

function getDefaultServerId(): string {
  return DEFAULT_ESPLORA_SERVERS.find((server) => server.id === DEFAULT_SERVER_ID)?.id ?? DEFAULT_ESPLORA_SERVERS[0]?.id ?? '';
}

/**
 * Expo `documentDirectory` is a `file://…` URI. On Android, bdk-rn's `walletInit` uses
 * `java.io.File(path).exists()` to choose Wallet.load vs Wallet.create; with the URI prefix
 * that returns false while SQLite data already exists → CreateWithPersistException.DataAlreadyExists.
 */
function sqliteWalletDbPath(network: Network): string {
  const dir = FileSystem.documentDirectory ?? '';
  const base = dir.endsWith('/') ? dir : `${dir}/`;
  const uriOrPath = `${base}bdk-wallet-${network}.db`;
  if (Platform.OS === 'web') {
    return uriOrPath;
  }
  return uriOrPath.replace(/^file:\/\//, '');
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
    const stack = typeof error.stack === 'string' ? error.stack.trim() : '';
    if (stack) return stack;
  }
  const asStr = String(error).trim();
  return asStr || 'Unknown error';
}

interface BdkState {
  isConnected: boolean;
  isSyncing: boolean;
  balance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
  error: string | null;
  isBdkInitialized: boolean;
  transactions: TransactionDetails[];
  wallet: BdkWallet | null;
}

interface BdkContextType extends BdkState {
  initializeBdk: (force?: boolean, serverIdOverride?: string | null) => Promise<boolean>;
  retryBdkConnection: () => Promise<void>;
  syncWallet: (walletParam?: BdkWallet, opts?: { rethrowOnError?: boolean }) => Promise<void>;
  disconnectBdk: () => Promise<void>;
  sendTransaction: (address: string, amount: number, feeRate: number) => Promise<string>;
  calculateTransactionFee: (address: string, amount: number, feeRate: number) => Promise<number>;
  getBlockainHeight: () => Promise<number | undefined>;
  availableServers: EsploraServerOption[];
  selectedServerId: string | null;
  setSelectedServer: (serverId: string) => Promise<void>;
}

const initialState: BdkState = {
  isConnected: false,
  isSyncing: false,
  balance: 0,
  confirmedBalance: 0,
  unconfirmedBalance: 0,
  error: null,
  isBdkInitialized: false,
  transactions: [],
  wallet: null,
};

const BdkContext = createContext<BdkContextType | undefined>(undefined);

interface BdkProviderProps {
  children: ReactNode;
}

export const BdkProvider: React.FC<BdkProviderProps> = ({ children }) => {
  const [state, setState] = useState<BdkState>(initialState);
  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const isInitializingRef = useRef<boolean>(false);
  const blockchainRef = useRef<Blockchain | null>(null);
  const walletRef = useRef<BdkWallet | null>(null);
  const { network } = useBreez();
  const currentNetworkRef = useRef<string | null>(null);
  const isBdkInitializedRef = useRef<boolean>(false);
  const errorRef = useRef<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    isBdkInitializedRef.current = state.isBdkInitialized;
  }, [state.isBdkInitialized]);

  useEffect(() => {
    errorRef.current = state.error;
  }, [state.error]);

  const getOnchainNetwork = useCallback((): Network => {
    return network === 'mainnet' ? Network.Bitcoin : Network.Testnet;
  }, [network]);

  const availableServers = useMemo(() => toEsploraServerOptions(DEFAULT_ESPLORA_SERVERS, getOnchainNetwork()), [getOnchainNetwork]);

  const getStoredServerId = useCallback(async (net: Network): Promise<string | null> => {
    const key = net === Network.Bitcoin ? SERVER_KEY_MAINNET : SERVER_KEY_TESTNET;
    const legacyKey = net === Network.Bitcoin ? LEGACY_SERVER_KEY_MAINNET : LEGACY_SERVER_KEY_TESTNET;
    const stored = (await getStorageItem<string>(key)) ?? (await getStorageItem<string>(legacyKey));
    return migrateLegacyServerId(stored);
  }, []);

  const persistServerId = useCallback(async (net: Network, serverId: string): Promise<void> => {
    const key = net === Network.Bitcoin ? SERVER_KEY_MAINNET : SERVER_KEY_TESTNET;
    await setStorageItem<string>(key, serverId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSelectedServer = async () => {
      const net = getOnchainNetwork();
      const storedId = await getStoredServerId(net);
      const isValid = !!storedId && DEFAULT_ESPLORA_SERVERS.some((server) => server.id === storedId);
      if (!cancelled) {
        setSelectedServerId(isValid ? storedId : getDefaultServerId());
      }
    };
    loadSelectedServer();
    return () => {
      cancelled = true;
    };
  }, [getOnchainNetwork, getStoredServerId]);

  const updateState = useCallback((updates: Partial<BdkState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const disconnectBdk = useCallback(async (): Promise<void> => {
    try {
      console.log('Disconnecting BDK...');

      blockchainRef.current = null;
      walletRef.current = null;

      updateState({
        wallet: null,
        isConnected: false,
        isSyncing: false,
        balance: 0,
        confirmedBalance: 0,
        unconfirmedBalance: 0,
        error: null,
        isBdkInitialized: false,
        transactions: [],
      });

      isInitializingRef.current = false;

      console.log('BDK disconnection completed');
    } catch (error) {
      console.error('Error during disconnection:', error);
      updateState({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [updateState]);

  const buildTransaction = async (address: string, amount: number, feeRate: number) => {
    const txBuilder = await new TxBuilder().create();
    const addressInstance = await new Address().create(address, getOnchainNetwork());
    const script = await addressInstance.scriptPubKey();

    await txBuilder.addRecipient(script, amount);
    await txBuilder.enableRbf();
    await txBuilder.feeRate(feeRate);

    if (state.wallet) {
      const txBuilderResult = await txBuilder.finish(state.wallet);
      const psbt = await state.wallet.sign(txBuilderResult.psbt);
      const tx = await psbt.extractTx();
      return tx;
    }
  };

  const validateWalletAndBlockchain = (wallet: Wallet | null, blockchain: Blockchain | null) => {
    if (!wallet || !blockchain) {
      throw new Error('Wallet ou blockchain not initialized');
    }
  };

  const sendTransaction = async (address: string, amount: number, feeRate: number = 1.0): Promise<string> => {
    try {
      validateWalletAndBlockchain(state.wallet, blockchainRef.current);
      updateState({ isSyncing: true });

      const tx = await buildTransaction(address, amount, feeRate);
      if (tx && blockchainRef.current) {
        await blockchainRef.current.broadcast(tx);
        const id = await tx.txid();
        updateState({ isSyncing: false });
        return id;
      }
      throw new Error('Failed to build send transaction');
    } catch (error) {
      console.error('Failed to send transaction:', error);
      updateState({
        error: error?.toString(),
        isSyncing: false,
      });
      throw error;
    }
  };

  const calculateTransactionFee = async (address: string, amount: number, feeRate: number = 1.0): Promise<number> => {
    try {
      validateWalletAndBlockchain(state.wallet, blockchainRef.current);
      const tx = await buildTransaction(address, amount, feeRate);
      if (tx) {
        const vsize = await tx.vsize();
        return vsize * feeRate;
      }
      throw new Error('Failed to calculate transaction fee');
    } catch (error) {
      console.error('Error calculating transaction fees:', error);
      throw error;
    }
  };

  const getBlockainHeight = async (): Promise<number | undefined> => {
    if (blockchainRef) {
      return await blockchainRef.current?.getHeight();
    }
    return undefined;
  };

  const syncWallet = useCallback(
    async (walletParam?: BdkWallet, opts?: { rethrowOnError?: boolean }): Promise<void> => {
      const walletToUse = walletParam || walletRef.current;

      try {
        if (!walletToUse || !blockchainRef.current) {
          console.log('Wallet or blockchain not initialized');
          return;
        }

        const seedPhrase = await _getSeedPhrase();
        if (!seedPhrase) {
          console.log('Recovery phrase deleted, automatic disconnection');
          await disconnectBdk();
          return;
        }

        updateState({ isSyncing: true });

        await walletToUse.sync(blockchainRef.current);
        const balance: Balance = await walletToUse.getBalance();
        const transactions: TransactionDetails[] = await walletToUse.listTransactions(true);
        updateState({
          balance: balance.spendable,
          confirmedBalance: balance.confirmed,
          unconfirmedBalance: balance.trustedPending + balance.untrustedPending,
          transactions: transactions.sort((a, b) => (b.confirmationTime?.timestamp || 0) - (a.confirmationTime?.timestamp || 0)),
          isSyncing: false,
          error: null,
        });
        console.log('Synchronization completed');
      } catch (error) {
        console.error('Error during synchronization:', error);
        const message = formatUnknownError(error);
        updateState({
          error: message,
          isSyncing: false,
        });
        if (opts?.rethrowOnError) {
          throw error;
        }
      }
    },
    [_getSeedPhrase, disconnectBdk, updateState],
  );

  const initializeBdk = useCallback(
    async (force: boolean = false, serverIdOverride?: string | null): Promise<boolean> => {
      if (isInitializingRef.current) {
        console.log('BDK initialization in progress');
        return false;
      }
      if (state.isBdkInitialized && !force) {
        console.log('BDK already initialized');
        return true;
      }

      try {
        isInitializingRef.current = true;
        updateState({ isSyncing: true, error: null, isConnected: false, isBdkInitialized: false, wallet: null });

        blockchainRef.current = null;
        walletRef.current = null;

        const seedPhrase = await _getSeedPhrase();
        if (!seedPhrase) {
          throw new Error('No recovery phrase found');
        }

        const mnemonic = await new Mnemonic().fromString(seedPhrase);
        const descriptorSecretKey = await new DescriptorSecretKey().create(getOnchainNetwork(), mnemonic);
        const externalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, getOnchainNetwork());
        const internalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, getOnchainNetwork());

        const dbPath = sqliteWalletDbPath(getOnchainNetwork());
        const dbConfig = await new DatabaseConfig().sqlite(dbPath);

        const wallet = await new Wallet().create(externalDescriptor, internalDescriptor, getOnchainNetwork(), dbConfig);

        const onchainNetwork = getOnchainNetwork();
        if (DEFAULT_ESPLORA_SERVERS.length === 0) {
          throw new Error('No Esplora indexer configured.');
        }

        const storedId = await getStoredServerId(onchainNetwork);
        const isManualSelection = serverIdOverride != null;
        const preferredId = serverIdOverride ?? storedId ?? getDefaultServerId();
        const candidates = isManualSelection ? DEFAULT_ESPLORA_SERVERS.filter((server) => server.id === serverIdOverride) : orderEsploraServers(DEFAULT_ESPLORA_SERVERS, preferredId);

        if (candidates.length === 0) {
          throw new Error(isManualSelection ? 'ESPLORA_CONNECTION_FAILED' : 'No Esplora indexer configured.');
        }

        const connectResult = await connectEsploraBackend(wallet, candidates, onchainNetwork, {
          manualSelection: isManualSelection,
        });

        blockchainRef.current = connectResult.blockchain;
        walletRef.current = wallet;
        currentNetworkRef.current = getOnchainNetwork();

        updateState({
          wallet,
          isConnected: true,
          isBdkInitialized: true,
          isSyncing: true,
        });

        await syncWallet(wallet, { rethrowOnError: true });
        setSelectedServerId(connectResult.serverId);
        return true;
      } catch (error) {
        const message = formatUnknownError(error);
        console.error('[BDK init] Fatal error — clearing on-chain wallet state', {
          error: message,
          ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        });

        blockchainRef.current = null;
        walletRef.current = null;
        updateState({
          error: message,
          isSyncing: false,
          isConnected: false,
          isBdkInitialized: false,
          wallet: null,
          transactions: [],
          balance: 0,
          confirmedBalance: 0,
          unconfirmedBalance: 0,
        });
        return false;
      } finally {
        isInitializingRef.current = false;
      }
    },
    [state.isBdkInitialized, updateState, _getSeedPhrase, getOnchainNetwork, syncWallet, getStoredServerId],
  );

  const setSelectedServer = useCallback(
    async (serverId: string): Promise<void> => {
      const net = getOnchainNetwork();
      const connected = await initializeBdk(true, serverId);
      if (!connected) {
        throw new Error('ESPLORA_CONNECTION_FAILED');
      }
      await persistServerId(net, serverId);
    },
    [getOnchainNetwork, persistServerId, initializeBdk],
  );

  const retryBdkConnection = useCallback(async (): Promise<void> => {
    if (isInitializingRef.current) {
      console.log('[BDK retry] Connection retry skipped — initialization already in progress');
      return;
    }

    if (state.isBdkInitialized && state.error == null) {
      await syncWallet();
      return;
    }

    console.log('[BDK retry] Manual full reconnect (full init from scratch)');
    await initializeBdk(true);
  }, [state.isBdkInitialized, state.error, syncWallet, initializeBdk]);

  useEffect(() => {
    const handleNetworkChange = async () => {
      if (currentNetworkRef.current !== null && currentNetworkRef.current !== getOnchainNetwork() && state.isBdkInitialized) {
        await disconnectBdk();
        setTimeout(async () => {
          await initializeBdk(true);
        }, 500);
      }
    };

    handleNetworkChange();
  }, [getOnchainNetwork, state.isBdkInitialized, disconnectBdk, initializeBdk]);

  const bdkIntervalDepsPrevRef = useRef<{ isConnected: boolean; isBdkInitialized: boolean } | null>(null);
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const prev = bdkIntervalDepsPrevRef.current;
    const next = { isConnected: state.isConnected, isBdkInitialized: state.isBdkInitialized };
    bdkIntervalDepsPrevRef.current = next;
    if (prev === null) {
      return;
    }
    if (prev.isConnected !== next.isConnected || prev.isBdkInitialized !== next.isBdkInitialized) {
      console.log('[BDK interval deps] isConnected / isBdkInitialized changed (may restart on-chain sync interval)', {
        from: prev,
        to: next,
      });
    }
  }, [state.isConnected, state.isBdkInitialized]);

  useEffect(() => {
    if (!state.isBdkInitialized || !state.isConnected || !walletRef.current) {
      return;
    }

    const syncInterval = setInterval(() => {
      if (walletRef.current && blockchainRef.current && !isInitializingRef.current) {
        console.log('[BDK interval] Automatic synchronization...');
        syncWallet();
      }
    }, SYNC_INTERVAL);

    return () => {
      console.log('[BDK interval] Stopping automatic synchronization (interval cleanup: BDK flags/syncWallet changed or provider unmount)');
      if (__DEV__) {
        console.trace('[BDK interval cleanup]');
      }
      clearInterval(syncInterval);
    };
  }, [state.isBdkInitialized, state.isConnected, syncWallet]);

  useEffect(() => {
    if (state.isBdkInitialized || state.error == null) {
      return;
    }

    const retryInterval = setInterval(() => {
      if (isInitializingRef.current || isBdkInitializedRef.current || errorRef.current == null) {
        return;
      }
      console.log('[BDK retry] Automatic full reconnect (full init from scratch)');
      initializeBdk(true).catch((err) => console.error('[BDK retry] Automatic reconnect failed', err));
    }, INIT_RETRY_INTERVAL);

    return () => {
      clearInterval(retryInterval);
    };
  }, [state.isBdkInitialized, state.error, initializeBdk]);

  const contextValue: BdkContextType = {
    ...state,
    initializeBdk,
    retryBdkConnection,
    syncWallet,
    disconnectBdk,
    sendTransaction,
    calculateTransactionFee,
    getBlockainHeight,
    availableServers,
    selectedServerId,
    setSelectedServer,
  };

  return <BdkContext.Provider value={contextValue}>{children}</BdkContext.Provider>;
};

export const useBdk = (): BdkContextType => {
  const context = useContext(BdkContext);
  if (context === undefined) {
    throw new Error('useBdk must be used within a BdkProvider');
  }
  return context;
};
