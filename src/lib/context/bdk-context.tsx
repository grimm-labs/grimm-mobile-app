/* eslint-disable max-lines-per-function */
import { LiquidNetwork } from '@breeztech/react-native-breez-sdk-liquid';
import type { Blockchain, Wallet as BdkWallet } from 'bdk-rn';
import { Blockchain as BdkBlockchain, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, Wallet } from 'bdk-rn';
import type { Balance, TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import { KeychainKind, Network } from 'bdk-rn/lib/lib/enums';
import * as FileSystem from 'expo-file-system';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useSecureStorage } from '../hooks/use-secure-storage';
import { useBreez } from './breez-context';

const SYNC_INTERVAL = 30000;

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
  initializeBdk: () => Promise<void>;
  syncWallet: () => Promise<void>;
  disconnectBdk: () => Promise<void>;
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
  const { liquidNetwork } = useBreez();

  const updateState = useCallback((updates: Partial<BdkState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const disconnectBdk = useCallback(async (): Promise<void> => {
    try {
      console.log('Disconnecting BDK...');

      // Reset references
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

      // Reset initialization flag
      isInitializingRef.current = false;

      console.log('BDK disconnection completed');
    } catch (error) {
      console.error('Error during disconnection:', error);
      updateState({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [updateState]);

  const syncWallet = useCallback(
    async (walletParam?: BdkWallet): Promise<void> => {
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
        const transactions: TransactionDetails[] = await walletToUse.listTransactions(false);

        updateState({
          balance: balance.confirmed,
          confirmedBalance: balance.confirmed,
          unconfirmedBalance: balance.trustedPending + balance.untrustedPending,
          transactions: transactions.sort((a, b) => (b.confirmationTime?.timestamp || 0) - (a.confirmationTime?.timestamp || 0)),
          isSyncing: false,
        });

        console.log('Synchronization completed');
      } catch (error) {
        console.error('Error during synchronization:', error);
        updateState({
          error: error instanceof Error ? error.message : String(error),
          isSyncing: false,
        });
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

        const mnemonic = await new Mnemonic().fromString(seedPhrase);

        let network: Network = Network.Bitcoin;
        if (liquidNetwork === LiquidNetwork.MAINNET) {
          network = Network.Bitcoin;
        } else if (liquidNetwork === LiquidNetwork.TESTNET) {
          network = Network.Testnet;
        }

        const descriptorSecretKey = await new DescriptorSecretKey().create(network, mnemonic);
        const externalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, network);
        const internalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, network);

        const dbPath = `${FileSystem.documentDirectory}/bdk-wallet-${network}.db`;
        const dbConfig = await new DatabaseConfig().sqlite(dbPath);

        const wallet = await new Wallet().create(externalDescriptor, internalDescriptor, network, dbConfig);

        // Configure blockchain (Electrum)
        const blockchainConfig = {
          url: network === Network.Bitcoin ? 'ssl://electrum.blockstream.info:50002' : 'ssl://electrum.blockstream.info:60002',
          sock5: null,
          retry: 5,
          timeout: 10,
          stopGap: 100,
          validateDomain: false,
        };

        const blockchain = await new BdkBlockchain().create(blockchainConfig);
        blockchainRef.current = blockchain;
        walletRef.current = wallet;

        console.log('Wallet created:', wallet);

        updateState({
          wallet,
          isConnected: true,
          isBdkInitialized: true,
          isSyncing: false,
        });

        console.log(`BDK successfully initialized on ${network}`);

        await syncWallet(wallet);
      } catch (error) {
        console.error('Error during BDK initialization:', error);
        updateState({
          error: error instanceof Error ? error.message : String(error),
          isSyncing: false,
          isConnected: false,
        });
      } finally {
        isInitializingRef.current = false;
      }
    },
    [state.isBdkInitialized, _getSeedPhrase, liquidNetwork, syncWallet, updateState],
  );

  const initializeBdkRef = useRef(initializeBdk);
  useEffect(() => {
    initializeBdkRef.current = initializeBdk;
  }, [initializeBdk]);

  useEffect(() => {
    initializeBdkRef.current(true);
  }, [liquidNetwork]);

  useEffect(() => {
    if (!state.isBdkInitialized || !state.isConnected || !walletRef.current) {
      return;
    }

    console.log('Starting automatic synchronization (30s)');

    const syncInterval = setInterval(() => {
      if (walletRef.current && blockchainRef.current && !isInitializingRef.current) {
        console.log('Automatic synchronization...');
        syncWallet();
      }
    }, SYNC_INTERVAL);

    return () => {
      console.log('Stopping automatic synchronization');
      clearInterval(syncInterval);
    };
  }, [state.isBdkInitialized, state.isConnected, syncWallet]);

  const contextValue: BdkContextType = {
    ...state,
    initializeBdk,
    syncWallet,
    disconnectBdk,
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
