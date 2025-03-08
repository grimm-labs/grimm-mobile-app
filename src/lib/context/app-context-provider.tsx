/* eslint-disable max-lines-per-function */
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Network } from 'bdk-rn/lib/lib/enums';
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import { BaseWallet } from '@/class/base-wallet';

type Props = PropsWithChildren<{}>;

type defaultContextType = {
  hideBalance: boolean;
  onboarding: boolean;
  selectedCountryCode: string;
  seedPhrase: string;
  selectedBitcoinNetwork: string;
  isDataLoaded: boolean;
  wallet?: BaseWallet;
  setHideBalance: (hideBalance: boolean) => void;
  setOnboarding: (onboarding: boolean) => void;
  setSelectedCountryCode: (country: string) => void;
  resetAppData: () => void;
  setSeedPhrase: (seedPhrase: string) => void;
  setSelectedBitcoinNetwork: (network: string) => void;
};

const defaultContext: defaultContextType = {
  hideBalance: false,
  onboarding: false,
  selectedCountryCode: 'CM',
  seedPhrase: '',
  selectedBitcoinNetwork: Network.Testnet,
  isDataLoaded: false,
  wallet: undefined,
  setHideBalance: () => {},
  setOnboarding: () => {},
  resetAppData: () => {},
  setSelectedCountryCode: () => {},
  setSeedPhrase: () => {},
  setSelectedBitcoinNetwork: () => {},
};

export const AppContext = createContext<defaultContextType>(defaultContext);

export const AppContextProvider = ({ children }: Props) => {
  const [hideBalance, _setHideBalance] = useState(defaultContext.hideBalance);
  const [onboarding, _setOnboarding] = useState(defaultContext.onboarding);
  const [selectedCountryCode, _setSelectedCountryCode] = useState(defaultContext.selectedCountryCode);
  const [seedPhrase, _setSeedPhrase] = useState(defaultContext.seedPhrase);
  const [selectedBitcoinNetwork, _setSelectedBitcoinNetwork] = useState(defaultContext.selectedBitcoinNetwork);
  const [isDataLoaded, _setIsDataLoaded] = useState(defaultContext.isDataLoaded);
  const [_wallet, _setWallet] = useState<BaseWallet | undefined>(defaultContext.wallet);

  const { getItem: _getHideBalance, setItem: _updateHideBalance } = useAsyncStorage('hideBalance');
  const { getItem: _getOnboarding, setItem: _updateOnboarding } = useAsyncStorage('onboarding');
  const { getItem: _getSelectedCountryCode, setItem: _updateSelectedCountryCode } = useAsyncStorage('selectedCountryCode');
  const { getItem: _getSeedPhrase, setItem: _updateSeedPhrase } = useAsyncStorage('seedPhrase');
  const { getItem: _getSelectedBitcoinNetwork, setItem: _updateSelectedBitcoinNetwork } = useAsyncStorage('selectedBitcoinNetowork');
  const { getItem: _getWallet, setItem: _updateWallet } = useAsyncStorage('wallet');

  const _loadHideBalance = useCallback(async () => {
    const ob = await _getHideBalance();
    if (ob !== null) {
      _setHideBalance(JSON.parse(ob));
    }
  }, [_getHideBalance, _setHideBalance]);

  const _loadOnboarding = useCallback(async () => {
    const ob = await _getOnboarding();
    if (ob !== null) {
      _setOnboarding(JSON.parse(ob));
    }
  }, [_getOnboarding, _setOnboarding]);

  const _loadSelectedCountryCode = useCallback(async () => {
    const ob = await _getSelectedCountryCode();
    if (ob !== null) {
      _setSelectedCountryCode(ob);
    }
  }, [_getSelectedCountryCode, _setSelectedCountryCode]);

  const _loadSeedPhrase = useCallback(async () => {
    const ob = await _getSeedPhrase();
    if (ob !== null) {
      _setSeedPhrase(ob);
    }
  }, [_getSeedPhrase, _setSeedPhrase]);

  const _loadSelectedBitcoinNetwork = useCallback(async () => {
    const ob = await _getSelectedBitcoinNetwork();
    if (ob !== null) {
      _setSelectedBitcoinNetwork(ob);
    }
  }, [_getSelectedBitcoinNetwork, _setSelectedBitcoinNetwork]);

  const _loadWallet = useCallback(async () => {
    const savedWallets = await _getWallet();
    if (savedWallets !== null) {
      const w = BaseWallet.fromJSON(savedWallets);
      _setWallet(w);
    }
  }, [_getWallet, _setWallet]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([_loadHideBalance(), _loadSelectedBitcoinNetwork(), _loadOnboarding(), _loadSelectedCountryCode(), _loadSeedPhrase(), _loadWallet]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        _setIsDataLoaded(true);
      }
    };

    loadData();
  }, [_loadHideBalance, _loadOnboarding, _loadSeedPhrase, _loadSelectedBitcoinNetwork, _loadSelectedCountryCode, _loadWallet]);

  const setOnboarding = useCallback(
    async (arg: boolean) => {
      try {
        await _setOnboarding(arg);
        await _updateOnboarding(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (Onboarding) Error loading data: ${e} [${arg}]`);
        throw new Error('Error setting onboarding');
      }
    },
    [_setOnboarding, _updateOnboarding],
  );

  const resetAppData = useCallback(async () => {
    try {
      await setOnboarding(true);
    } catch (e) {
      console.error(`[AsyncStorage] (Reset app data) Error loading data: ${e}`);

      throw new Error('Unable to reset app data');
    }
  }, [setOnboarding]);

  const setHideBalance = useCallback(
    async (arg: boolean) => {
      try {
        await _setHideBalance(arg);
        await _updateHideBalance(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (hideBalance) Error loading data: ${e} [${arg}]`);
        throw new Error('Error setting onboarding');
      }
    },
    [_setHideBalance, _updateHideBalance],
  );

  const setSelectedCountryCode = useCallback(
    async (arg: string) => {
      try {
        await _setSelectedCountryCode(arg);
        await _updateSelectedCountryCode(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (selectedCountryCode) Error loading data: ${e} [${arg}]`);
        throw new Error('Error setting selectedCountryCode');
      }
    },
    [_setSelectedCountryCode, _updateSelectedCountryCode],
  );

  const setSeedPhrase = useCallback(
    async (arg: string) => {
      try {
        await _setSeedPhrase(arg);
        await _updateSeedPhrase(arg);
      } catch (e) {
        console.error(`[AsyncStorage] (seedPhrase) Error loading data: ${e} [${arg}]`);
        throw new Error('Error setting seedPhrase');
      }
    },
    [_setSeedPhrase, _updateSeedPhrase],
  );

  const setSelectedBitcoinNetwork = useCallback(
    async (arg: string) => {
      try {
        await _setSelectedBitcoinNetwork(arg);
        await _updateSelectedBitcoinNetwork(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (bitcoinNetwork) Error loading data: ${e} [${arg}]`);
        throw new Error('Error setting bitcoinNetwork');
      }
    },
    [_setSelectedBitcoinNetwork, _updateSelectedBitcoinNetwork],
  );

  return (
    <AppContext.Provider
      value={{
        hideBalance,
        onboarding,
        selectedCountryCode,
        seedPhrase,
        selectedBitcoinNetwork,
        isDataLoaded,
        setHideBalance,
        setOnboarding,
        resetAppData,
        setSelectedCountryCode,
        setSeedPhrase,
        setSelectedBitcoinNetwork,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
