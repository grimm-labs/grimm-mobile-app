/* eslint-disable security/detect-object-injection */
/* eslint-disable max-lines-per-function */
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import type { Blockchain, Wallet as BdkWallet } from 'bdk-rn';
import { Address, Blockchain as BdkBlockchain, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, TxBuilder, Wallet } from 'bdk-rn';
import type { Balance, TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import { KeychainKind, Network } from 'bdk-rn/lib/lib/enums';
import * as FileSystem from 'expo-file-system';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Tor from 'react-native-tor';

import { DEFAULT_SERVERS, DEFAULT_SERVERS_ONION, DEFAULT_SERVERS_TESTNET, DEFAULT_SERVERS_TESTNET_ONION } from '../constant';
import { useSecureStorage } from '../hooks/use-secure-storage';
import { useBreez } from './breez-context';

const SYNC_INTERVAL = 60000;
const ASYNC_STORAGE_BDK_USE_TOR = 'bdkElectrumUseTor';

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

type TorModule = ReturnType<typeof Tor>;
let torSingleton: TorModule | null = null;

function getTor(): TorModule | null {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!torSingleton) {
    torSingleton = Tor({ stopDaemonOnBackground: false });
    console.log('[BDK/Tor] Tor module created (singleton)');
  }
  return torSingleton;
}

async function logTorDaemonStatus(tor: TorModule, phase: string): Promise<void> {
  try {
    const status = await tor.getDaemonStatus();
    console.log(`[BDK/Tor] ${phase} getDaemonStatus=${status}`);
  } catch (error) {
    console.warn(`[BDK/Tor] ${phase} getDaemonStatus failed`, error);
  }
}

async function stopTorIfRunning(): Promise<void> {
  const tor = getTor();
  if (!tor) {
    return;
  }
  try {
    await tor.stopIfRunning();
    await logTorDaemonStatus(tor, 'after stopIfRunning');
  } catch (error) {
    console.warn('Tor stop failed:', error);
  }
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
  useTor: boolean;
  isUseTorPreferenceLoaded: boolean;
  setUseTor: (value: boolean) => Promise<void>;
  initializeBdk: () => Promise<void>;
  syncWallet: (walletParam?: BdkWallet, opts?: { rethrowOnError?: boolean }) => Promise<void>;
  disconnectBdk: () => Promise<void>;
  sendTransaction: (address: string, amount: number, feeRate: number) => Promise<string>;
  calculateTransactionFee: (address: string, amount: number, feeRate: number) => Promise<number>;
  getBlockainHeight: () => Promise<number | undefined>;
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
  const [useTor, setUseTorState] = useState<boolean>(true);
  const [isUseTorPreferenceLoaded, setIsUseTorPreferenceLoaded] = useState<boolean>(false);
  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getUseTor, setItem: _updateUseTor } = useAsyncStorage(ASYNC_STORAGE_BDK_USE_TOR);
  const isInitializingRef = useRef<boolean>(false);
  const blockchainRef = useRef<Blockchain | null>(null);
  const walletRef = useRef<BdkWallet | null>(null);
  const useTorRef = useRef<boolean>(true);
  const { network } = useBreez();
  const currentNetworkRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await _getUseTor();
        if (cancelled) {
          return;
        }
        if (raw !== null) {
          const parsed = JSON.parse(raw) as boolean;
          useTorRef.current = parsed;
          setUseTorState(parsed);
        }
      } catch (error) {
        console.error('[BDK] Failed to load useTor preference', error);
      } finally {
        if (!cancelled) {
          setIsUseTorPreferenceLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [_getUseTor]);

  useEffect(() => {
    useTorRef.current = useTor;
  }, [useTor]);

  const getOnchainNetwork = useCallback((): Network => {
    return network === 'mainnet' ? Network.Bitcoin : Network.Testnet;
  }, [network]);

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

      await stopTorIfRunning();

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
    async (force: boolean = false): Promise<void> => {
      if (isInitializingRef.current) {
        console.log('BDK initialization in progress');
        return;
      }
      if (state.isBdkInitialized && !force) {
        console.log('BDK already initialized');
        return;
      }

      try {
        isInitializingRef.current = true;
        updateState({ isSyncing: true, error: null });

        const seedPhrase = await _getSeedPhrase();
        if (!seedPhrase) {
          throw new Error('No recovery phrase found');
        }

        const wantTorChain = useTorRef.current && Platform.OS !== 'web';

        let sock5Proxy: string | null = null;
        if (wantTorChain) {
          const tor = getTor();
          if (!tor) {
            throw new Error('On-chain Tor mode requires Tor (not available on this platform).');
          }
          await logTorDaemonStatus(tor, 'before startIfNotStarted');
          const socksPort = await tor.startIfNotStarted();
          sock5Proxy = `127.0.0.1:${socksPort}`;
          await logTorDaemonStatus(tor, 'after startIfNotStarted');
          console.log(`[BDK/Tor] SOCKS proxy ready sock5=${sock5Proxy} (DONE = circuit ready per react-native-tor)`);
        } else {
          console.log('[BDK] Electrum clearnet mode (Tor off or web); no local SOCKS');
        }

        const mnemonic = await new Mnemonic().fromString(seedPhrase);
        const descriptorSecretKey = await new DescriptorSecretKey().create(getOnchainNetwork(), mnemonic);
        const externalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, getOnchainNetwork());
        const internalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, getOnchainNetwork());

        const dbPath = sqliteWalletDbPath(getOnchainNetwork());
        const dbConfig = await new DatabaseConfig().sqlite(dbPath);

        const wallet = await new Wallet().create(externalDescriptor, internalDescriptor, getOnchainNetwork(), dbConfig);

        /** Prefer `t` (cleartext Electrum TCP); fall back to `s` if only SSL port is listed. */
        const electrumServersToEntries = (record: Record<string, { t?: string; s?: string }>) =>
          Object.entries(record)
            .map(([host, ports]) => {
              const typedPorts = ports as { t?: string; s?: string };
              return { host, port: typedPorts.t ?? typedPorts.s };
            })
            .filter(({ port }) => !!port);

        const onionOrClearnetPool = wantTorChain
          ? getOnchainNetwork() === Network.Bitcoin
            ? DEFAULT_SERVERS_ONION
            : DEFAULT_SERVERS_TESTNET_ONION
          : getOnchainNetwork() === Network.Bitcoin
            ? DEFAULT_SERVERS
            : DEFAULT_SERVERS_TESTNET;
        const servers = electrumServersToEntries(onionOrClearnetPool as Record<string, { t?: string; s?: string }>);
        if (servers.length === 0) {
          throw new Error(
            wantTorChain
              ? getOnchainNetwork() === Network.Bitcoin
                ? 'No .onion Electrum server configured for mainnet (DEFAULT_SERVERS_ONION).'
                : 'No .onion Electrum server configured for testnet. Add at least one entry in DEFAULT_SERVERS_TESTNET_ONION.'
              : getOnchainNetwork() === Network.Bitcoin
                ? 'No clearnet Electrum server configured for mainnet.'
                : 'No clearnet Electrum server configured for testnet.',
          );
        }
        const random = Math.floor(Math.random() * servers.length);
        const { host, port } = servers[random];
        const electrumUrl = wantTorChain ? `tcp://${host}:${port}` : `ssl://${host}:${port}`;

        console.log(`[BDK init] Electrum ${wantTorChain ? 'via Tor SOCKS' : 'clearnet SSL'} → ${electrumUrl} (timeout=${wantTorChain ? 60 : 10}s, retry=${wantTorChain ? 8 : 5})`);

        const blockchainConfig = {
          url: electrumUrl,
          sock5: sock5Proxy,
          retry: wantTorChain ? 8 : 5,
          timeout: wantTorChain ? 60 : 10,
          stopGap: 100,
          validateDomain: false,
        };

        let blockchain;
        try {
          blockchain = await new BdkBlockchain().create(blockchainConfig);
        } catch (error) {
          const message = formatUnknownError(error);
          console.error('[BDK init] Electrum blockchain create failed — check Tor, .onion reachability, or firewall.', {
            electrumUrl,
            useTor: wantTorChain,
            error: message,
            ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
          });
          throw error;
        }

        blockchainRef.current = blockchain;
        walletRef.current = wallet;

        currentNetworkRef.current = getOnchainNetwork();

        updateState({
          wallet,
          isConnected: true,
          isBdkInitialized: true,
          isSyncing: true,
        });

        try {
          await syncWallet(wallet, { rethrowOnError: true });
        } catch (syncError) {
          const message = formatUnknownError(syncError);
          console.error('[BDK init] First sync failed — Tor left running; wallet loaded. Retry sync from UI or wait for automatic sync.', {
            error: message,
          });
          updateState({
            error: message,
            isSyncing: false,
          });
          return;
        }
      } catch (error) {
        const message = formatUnknownError(error);
        console.error('[BDK init] Fatal error — stopping Tor and clearing on-chain wallet state', {
          error: message,
          ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
        });

        blockchainRef.current = null;
        walletRef.current = null;
        await stopTorIfRunning();
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
      } finally {
        isInitializingRef.current = false;
      }
    },
    [state.isBdkInitialized, updateState, _getSeedPhrase, getOnchainNetwork, syncWallet],
  );

  const setUseTor = useCallback(
    async (value: boolean): Promise<void> => {
      await _updateUseTor(JSON.stringify(value));
      useTorRef.current = value;
      setUseTorState(value);
      const wasInitialized = state.isBdkInitialized || walletRef.current !== null;
      if (wasInitialized) {
        await disconnectBdk();
        await initializeBdk(true);
      }
    },
    [_updateUseTor, state.isBdkInitialized, disconnectBdk, initializeBdk],
  );

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

  const contextValue: BdkContextType = {
    ...state,
    useTor,
    isUseTorPreferenceLoaded,
    setUseTor,
    initializeBdk,
    syncWallet,
    disconnectBdk,
    sendTransaction,
    calculateTransactionFee,
    getBlockainHeight,
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
