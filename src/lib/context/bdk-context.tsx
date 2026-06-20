/* eslint-disable no-void */
/* eslint-disable security/detect-object-injection */
/* eslint-disable max-lines-per-function */
import type { Blockchain, Wallet as BdkWallet } from 'bdk-rn';
import { Address, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, TxBuilder, Wallet } from 'bdk-rn';
import type { Balance, TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import { KeychainKind, Network } from 'bdk-rn/lib/lib/enums';
import * as FileSystem from 'expo-file-system';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { connectEsploraBackend, type EsploraConnectResult, type EsploraServerOption, isEsploraRateLimitError, migrateLegacyServerId, orderEsploraServers, toEsploraServerOptions } from '../bdk-blockchain-connect';
import { DEFAULT_ESPLORA_SERVERS, DEFAULT_SERVER_ID } from '../constant';
import { useSecureStorage } from '../hooks/use-secure-storage';
import { getItem as getStorageItem, removeItem as removeStorageItem, setItem as setStorageItem } from '../storage';
import { useBreez } from './breez-context';

export type { EsploraServerOption };

const SYNC_INTERVAL = 60000;
const INIT_RETRY_INTERVAL = 30000;

const SERVER_KEY_MAINNET = 'selectedEsploraServer_mainnet';
const SERVER_KEY_TESTNET = 'selectedEsploraServer_testnet';
const LEGACY_SERVER_KEY_MAINNET = 'selectedElectrumServer_mainnet';
const LEGACY_SERVER_KEY_TESTNET = 'selectedElectrumServer_testnet';
const SNAPSHOT_KEY_MAINNET = 'bdkWalletSnapshot_mainnet';
const SNAPSHOT_KEY_TESTNET = 'bdkWalletSnapshot_testnet';

type StoredTransactionDetails = {
  txid: string;
  received: number;
  sent: number;
  fee?: number;
  confirmationTime?: { height?: number; timestamp?: number };
};

type PersistedBdkSnapshot = {
  balance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
  transactions: StoredTransactionDetails[];
  updatedAt: number;
};

function snapshotStorageKey(network: Network): string {
  return network === Network.Bitcoin ? SNAPSHOT_KEY_MAINNET : SNAPSHOT_KEY_TESTNET;
}

function toStoredTransactions(transactions: TransactionDetails[]): StoredTransactionDetails[] {
  return transactions.map((tx) => ({
    txid: tx.txid,
    received: tx.received,
    sent: tx.sent,
    fee: tx.fee,
    confirmationTime: tx.confirmationTime ? { height: tx.confirmationTime.height, timestamp: tx.confirmationTime.timestamp } : undefined,
  }));
}

function fromStoredTransactions(transactions: StoredTransactionDetails[]): TransactionDetails[] {
  return transactions.map(
    (tx) =>
      ({
        txid: tx.txid,
        received: tx.received,
        sent: tx.sent,
        fee: tx.fee,
        confirmationTime: tx.confirmationTime,
        transaction: null,
      }) as TransactionDetails,
  );
}

function hasWalletData(snapshot: Pick<BdkState, 'balance' | 'transactions'>): boolean {
  return snapshot.balance > 0 || snapshot.transactions.length > 0;
}

/** Only overwrite displayed balance/txs when the snapshot actually has data. */
function walletDisplayFields(
  snapshot: Pick<BdkState, 'balance' | 'confirmedBalance' | 'unconfirmedBalance' | 'transactions'>,
): Partial<Pick<BdkState, 'balance' | 'confirmedBalance' | 'unconfirmedBalance' | 'transactions'>> {
  return hasWalletData(snapshot) ? snapshot : {};
}

async function persistBdkSnapshot(network: Network, snapshot: Pick<BdkState, 'balance' | 'confirmedBalance' | 'unconfirmedBalance' | 'transactions'>): Promise<void> {
  if (!hasWalletData(snapshot)) {
    return;
  }
  const payload: PersistedBdkSnapshot = {
    balance: snapshot.balance,
    confirmedBalance: snapshot.confirmedBalance,
    unconfirmedBalance: snapshot.unconfirmedBalance,
    transactions: toStoredTransactions(snapshot.transactions),
    updatedAt: Date.now(),
  };
  await setStorageItem(snapshotStorageKey(network), payload);
}

async function loadPersistedBdkSnapshot(network: Network): Promise<Pick<BdkState, 'balance' | 'confirmedBalance' | 'unconfirmedBalance' | 'transactions'> | null> {
  const stored = await getStorageItem<PersistedBdkSnapshot>(snapshotStorageKey(network));
  if (!stored || (stored.balance <= 0 && stored.transactions.length === 0)) {
    return null;
  }
  return {
    balance: stored.balance,
    confirmedBalance: stored.confirmedBalance,
    unconfirmedBalance: stored.unconfirmedBalance,
    transactions: fromStoredTransactions(stored.transactions),
  };
}

async function clearPersistedBdkSnapshot(network: Network): Promise<void> {
  await removeStorageItem(snapshotStorageKey(network));
}

function getDefaultServerId(): string {
  return DEFAULT_ESPLORA_SERVERS.find((server) => server.id === DEFAULT_SERVER_ID)?.id ?? DEFAULT_ESPLORA_SERVERS[0]?.id ?? '';
}

/**
 * Expo `documentDirectory` is a `file://…` URI. Strip the prefix on native so bdk-rn receives
 * an absolute path for Persister.newSqlite (see BdkRnModule.walletInit).
 */
function sqliteWalletDbUri(network: Network): string {
  const dir = FileSystem.documentDirectory ?? '';
  const base = dir.endsWith('/') ? dir : `${dir}/`;
  return `${base}bdk-wallet-${network}.db`;
}

function sqliteWalletDbPath(network: Network): string {
  const uriOrPath = sqliteWalletDbUri(network);
  if (Platform.OS === 'web') {
    return uriOrPath;
  }
  return uriOrPath.replace(/^file:\/\//, '');
}

function isWalletPersistenceError(error: unknown): boolean {
  const message = formatUnknownError(error);
  return message.includes('CouldNotLoad') || message.includes('DataAlreadyExists') || message.includes('LoadWithPersistException') || message.includes('CreateWithPersistException');
}

async function deleteWalletDbFiles(network: Network): Promise<void> {
  const dbUri = sqliteWalletDbUri(network);
  const basePath = dbUri.replace(/\.db$/, '');
  for (const suffix of ['', '-shm', '-wal', '-journal'] as const) {
    const uri = suffix === '' ? dbUri : `${basePath}.db${suffix}`;
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // best-effort cleanup before native retry
    }
  }
}

/** Empty SQLite files left by Persister.newSqlite break Wallet.load on the next launch. */
async function removeStaleEmptyWalletDb(network: Network): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const dbUri = sqliteWalletDbUri(network);
  try {
    const info = await FileSystem.getInfoAsync(dbUri);
    if (info.exists && 'size' in info && info.size === 0) {
      await deleteWalletDbFiles(network);
    }
  } catch {
    // non-fatal — native walletInit performs its own recovery
  }
}

async function createBdkWallet(externalDescriptor: Awaited<ReturnType<Descriptor['newBip84']>>, internalDescriptor: Awaited<ReturnType<Descriptor['newBip84']>>, onchainNetwork: Network): Promise<BdkWallet> {
  const dbPath = sqliteWalletDbPath(onchainNetwork);
  await removeStaleEmptyWalletDb(onchainNetwork);

  try {
    const dbConfig = await new DatabaseConfig().sqlite(dbPath);
    return await new Wallet().create(externalDescriptor, internalDescriptor, onchainNetwork, dbConfig);
  } catch (error) {
    if (!isWalletPersistenceError(error)) {
      throw error;
    }
    console.warn('[BDK init] SQLite wallet failed — deleting local cache and retrying once', formatUnknownError(error));
    await deleteWalletDbFiles(onchainNetwork);
    await clearPersistedBdkSnapshot(onchainNetwork);
    const dbConfig = await new DatabaseConfig().sqlite(dbPath);
    return await new Wallet().create(externalDescriptor, internalDescriptor, onchainNetwork, dbConfig);
  }
}

function walletBalanceSats(balance: Balance): number {
  return balance.confirmed + balance.trustedPending + balance.untrustedPending;
}

function sortTransactions(transactions: TransactionDetails[]): TransactionDetails[] {
  return transactions.sort((a, b) => (b.confirmationTime?.timestamp || 0) - (a.confirmationTime?.timestamp || 0));
}

/** Reads balance and transactions from the local SQLite wallet (no network). */
async function readWalletSnapshot(wallet: BdkWallet): Promise<Pick<BdkState, 'balance' | 'confirmedBalance' | 'unconfirmedBalance' | 'transactions'>> {
  const balance: Balance = await wallet.getBalance();
  const transactions: TransactionDetails[] = await wallet.listTransactions(true);
  const balanceSats = walletBalanceSats(balance);
  return {
    balance: balanceSats,
    confirmedBalance: balance.confirmed,
    unconfirmedBalance: balance.trustedPending + balance.untrustedPending,
    transactions: sortTransactions(transactions),
  };
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

  useEffect(() => {
    let cancelled = false;
    const restorePersistedSnapshot = async () => {
      const snapshot = await loadPersistedBdkSnapshot(getOnchainNetwork());
      if (cancelled || snapshot == null) {
        return;
      }
      console.log('[BDK] Restored last synced snapshot from storage', {
        balance: snapshot.balance,
        txCount: snapshot.transactions.length,
      });
      updateState(snapshot);
    };
    restorePersistedSnapshot();
    return () => {
      cancelled = true;
    };
  }, [getOnchainNetwork, updateState]);

  const disconnectBdk = useCallback(async (): Promise<void> => {
    try {
      console.log('Disconnecting BDK...');

      blockchainRef.current = null;
      walletRef.current = null;

      await clearPersistedBdkSnapshot(getOnchainNetwork());

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
  }, [updateState, getOnchainNetwork]);

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
    async (walletParam?: BdkWallet, opts?: { rethrowOnError?: boolean; skipServerFallback?: boolean }): Promise<void> => {
      const walletToUse = walletParam || walletRef.current;

      const applySyncResult = async (): Promise<void> => {
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
        const balanceSats = walletBalanceSats(balance);
        console.log('[BDK sync] Completed', {
          spendable: balance.spendable,
          confirmed: balance.confirmed,
          trustedPending: balance.trustedPending,
          untrustedPending: balance.untrustedPending,
          total: balanceSats,
          txCount: transactions.length,
        });
        const snapshot = {
          balance: balanceSats,
          confirmedBalance: balance.confirmed,
          unconfirmedBalance: balance.trustedPending + balance.untrustedPending,
          transactions: sortTransactions(transactions),
        };
        updateState({
          ...snapshot,
          isSyncing: false,
          error: null,
        });
        await persistBdkSnapshot(getOnchainNetwork(), snapshot);
        console.log('Synchronization completed');
      };

      try {
        await applySyncResult();
      } catch (error) {
        const canFallback = !opts?.skipServerFallback && isEsploraRateLimitError(error) && walletToUse;
        if (canFallback) {
          const onchainNetwork = getOnchainNetwork();
          const currentId = selectedServerId ?? (await getStoredServerId(onchainNetwork)) ?? getDefaultServerId();
          const fallbackServers = DEFAULT_ESPLORA_SERVERS.filter((server) => server.id !== currentId);

          for (const server of fallbackServers) {
            try {
              console.warn(`[BDK sync] Rate limited on ${currentId} — switching to ${server.id}`);
              const connectResult = await connectEsploraBackend([server], onchainNetwork, { manualSelection: true });
              blockchainRef.current = connectResult.blockchain;
              setSelectedServerId(connectResult.serverId);
              await persistServerId(onchainNetwork, connectResult.serverId);
              await applySyncResult();
              return;
            } catch (fallbackError) {
              if (!isEsploraRateLimitError(fallbackError)) {
                console.error('Error during synchronization:', fallbackError);
                const message = formatUnknownError(fallbackError);
                updateState({ error: message, isSyncing: false });
                if (opts?.rethrowOnError) {
                  throw fallbackError;
                }
                return;
              }
            }
          }
        }

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
    [_getSeedPhrase, disconnectBdk, updateState, getOnchainNetwork, selectedServerId, getStoredServerId, persistServerId],
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
        // Keep balance/transactions visible while reconnecting — stale-while-revalidate.
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

        const wallet = await createBdkWallet(externalDescriptor, internalDescriptor, getOnchainNetwork());
        const onchainNetwork = getOnchainNetwork();
        const cachedSnapshot = await readWalletSnapshot(wallet);
        if (hasWalletData(cachedSnapshot)) {
          console.log('[BDK init] Showing cached wallet snapshot from SQLite', {
            balance: cachedSnapshot.balance,
            txCount: cachedSnapshot.transactions.length,
          });
          updateState(cachedSnapshot);
          await persistBdkSnapshot(onchainNetwork, cachedSnapshot);
        }

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

        let connectResult: EsploraConnectResult | null = null;
        let lastInitError: unknown = null;

        for (let i = 0; i < candidates.length; i++) {
          const server = candidates[i];
          try {
            connectResult = await connectEsploraBackend([server], onchainNetwork, { manualSelection: true });
            blockchainRef.current = connectResult.blockchain;
            walletRef.current = wallet;
            currentNetworkRef.current = getOnchainNetwork();

            updateState({
              wallet,
              isConnected: true,
              isBdkInitialized: true,
              isSyncing: true,
              ...walletDisplayFields(cachedSnapshot),
            });

            setSelectedServerId(connectResult.serverId);
            await persistServerId(onchainNetwork, connectResult.serverId);

            // Sync in background — cached SQLite snapshot is already on screen.
            void syncWallet(wallet).catch((syncError) => {
              console.error('[BDK init] Background sync failed', formatUnknownError(syncError));
            });

            return true;
          } catch (error) {
            lastInitError = error;
            const hasNextServer = !isManualSelection && i < candidates.length - 1;
            if (hasNextServer) {
              console.warn(`[BDK init] Failed on ${server.id} — trying next Esplora indexer`, formatUnknownError(error));
              connectResult = null;
              continue;
            }
            throw error;
          }
        }

        throw lastInitError ?? new Error('ESPLORA_CONNECTION_FAILED');
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
        });
        return false;
      } finally {
        isInitializingRef.current = false;
      }
    },
    [state.isBdkInitialized, updateState, _getSeedPhrase, getOnchainNetwork, syncWallet, getStoredServerId, persistServerId],
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
