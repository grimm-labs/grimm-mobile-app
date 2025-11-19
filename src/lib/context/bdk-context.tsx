/* eslint-disable max-lines-per-function */
import { LiquidNetwork } from '@breeztech/react-native-breez-sdk-liquid';
import type { Blockchain, Wallet as BdkWallet } from 'bdk-rn';
import { Address, Blockchain as BdkBlockchain, DatabaseConfig, Descriptor, DescriptorSecretKey, Mnemonic, TxBuilder, Wallet } from 'bdk-rn';
import type { Balance, TransactionDetails } from 'bdk-rn/lib/classes/Bindings';
import { KeychainKind, Network } from 'bdk-rn/lib/lib/enums';
import * as FileSystem from 'expo-file-system';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { MEMPOOL_SSL_URL, MEMPOOL_SSL_URL_TESTNET4 } from '@/lib/constant';

import { useSecureStorage } from '../hooks/use-secure-storage';
import { useBreez } from './breez-context';

const SYNC_INTERVAL = 20000;

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
  const { getItem: _getSeedPhrase } = useSecureStorage('seedPhrase');
  const isInitializingRef = useRef<boolean>(false);
  const blockchainRef = useRef<Blockchain | null>(null);
  const walletRef = useRef<BdkWallet | null>(null);
  const { liquidNetwork } = useBreez();
  const currentNetworkRef = useRef<LiquidNetwork | null>(null);

  const getOnchainNetwork = useCallback((): Network => {
    let n: Network = Network.Testnet;
    if (liquidNetwork === LiquidNetwork.MAINNET) {
      n = Network.Bitcoin;
    } else if (liquidNetwork === LiquidNetwork.TESTNET) {
      n = Network.Testnet;
    }
    return n;
  }, [liquidNetwork]);

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
    const network = getOnchainNetwork();
    const addressInstance = await new Address().create(address, network);
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
        const transactions: TransactionDetails[] = await walletToUse.listTransactions(true);
        updateState({
          balance: balance.spendable,
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
        const network = getOnchainNetwork();
        const descriptorSecretKey = await new DescriptorSecretKey().create(network, mnemonic);
        const externalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.External, network);
        const internalDescriptor = await new Descriptor().newBip84(descriptorSecretKey, KeychainKind.Internal, network);

        const dbPath = `${FileSystem.documentDirectory}/bdk-wallet-${network}.db`;
        const dbConfig = await new DatabaseConfig().sqlite(dbPath);

        const wallet = await new Wallet().create(externalDescriptor, internalDescriptor, network, dbConfig);

        const blockchainConfig = {
          url: network === Network.Testnet ? MEMPOOL_SSL_URL_TESTNET4 : MEMPOOL_SSL_URL,
          sock5: null,
          retry: 5,
          timeout: 10,
          stopGap: 100,
          validateDomain: false,
        };

        const blockchain = await new BdkBlockchain().create(blockchainConfig);
        blockchainRef.current = blockchain;
        walletRef.current = wallet;

        currentNetworkRef.current = liquidNetwork;

        updateState({
          wallet,
          isConnected: true,
          isBdkInitialized: true,
          isSyncing: false,
        });

        console.log(`BDK successfully initialized on ${network}`);

        await syncWallet(wallet);
      } catch (error) {
        updateState({
          error: error instanceof Error ? error.message : String(error),
          isSyncing: false,
          isConnected: false,
        });
      } finally {
        isInitializingRef.current = false;
      }
    },
    [state.isBdkInitialized, updateState, _getSeedPhrase, getOnchainNetwork, liquidNetwork, syncWallet],
  );

  useEffect(() => {
    const handleNetworkChange = async () => {
      if (currentNetworkRef.current !== null && currentNetworkRef.current !== liquidNetwork && state.isBdkInitialized) {
        await disconnectBdk();
        setTimeout(async () => {
          await initializeBdk(true);
        }, 500);
      }
    };

    handleNetworkChange();
  }, [liquidNetwork, state.isBdkInitialized, disconnectBdk, initializeBdk]);

  useEffect(() => {
    if (!state.isBdkInitialized || !state.isConnected || !walletRef.current) {
      return;
    }

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
