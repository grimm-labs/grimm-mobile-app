/* eslint-disable max-lines-per-function */
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import type { Country } from '@/interfaces';
import { useSecureStorage } from '@/lib/hooks';

type Props = PropsWithChildren<{}>;

type defaultContextType = {
  hideBalance: boolean;
  onboarding: boolean;
  isDataLoaded: boolean;
  seedPhrase: string;
  selectedCountry: Country;
  setHideBalance: (hideBalance: boolean) => void;
  setOnboarding: (onboarding: boolean) => void;
  resetAppData: () => void;
  setSeedPhrase: (seedPhrase: string) => void;
  setSelectedCountry: (country: Country) => void;
};

const defaultContext: defaultContextType = {
  hideBalance: false,
  onboarding: false,
  isDataLoaded: false,
  seedPhrase: '',
  selectedCountry: {
    currency: 'XAF',
    callingCode: '237',
    region: 'Africa',
    subregion: 'Middle Africa',
    name: 'Cameroon',
    nameFr: 'Cameroun',
    isoCode: 'CM',
  },
  setHideBalance: () => {},
  setOnboarding: () => {},
  resetAppData: () => {},
  setSeedPhrase: () => {},
  setSelectedCountry: () => {},
};

export const AppContext = createContext<defaultContextType>(defaultContext);

export const AppContextProvider = ({ children }: Props) => {
  const [hideBalance, _setHideBalance] = useState(defaultContext.hideBalance);
  const [onboarding, _setOnboarding] = useState(defaultContext.onboarding);
  const [isDataLoaded, _setIsDataLoaded] = useState(defaultContext.isDataLoaded);
  const [seedPhrase, _setSeedPhrase] = useState(defaultContext.seedPhrase);
  const [selectedCountry, _setSelectedCountry] = useState<Country>(defaultContext.selectedCountry);

  const { getItem: _getHideBalance, setItem: _updateHideBalance } = useAsyncStorage('hideBalance');
  const { getItem: _getOnboarding, setItem: _updateOnboarding } = useAsyncStorage('onboarding');
  const { getItem: _getSelectedCountry, setItem: _updateSelectedCountry } = useAsyncStorage('selectedCountry');
  const { getItem: _getSeedPhrase, setItem: _updateSeedPhrase } = useSecureStorage('seedPhrase');

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

  const _loadSelectedCountry = useCallback(async () => {
    const ob = await _getSelectedCountry();
    if (ob !== null) {
      _setSelectedCountry(JSON.parse(ob));
    }
  }, [_getSelectedCountry, _setSelectedCountry]);

  const _loadSeedPhrase = useCallback(async () => {
    const ob = await _getSeedPhrase();
    if (ob !== null) {
      _setSeedPhrase(ob);
    }
  }, [_getSeedPhrase, _setSeedPhrase]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([_loadHideBalance(), _loadOnboarding(), _loadSelectedCountry(), _loadSeedPhrase()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        _setIsDataLoaded(true);
      }
    };

    loadData();
  }, [_loadHideBalance, _loadOnboarding, _loadSelectedCountry, _loadSeedPhrase]);

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
        throw new Error('Error setting hideBalance');
      }
    },
    [_setHideBalance, _updateHideBalance],
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

  const setSelectedCountry = useCallback(
    async (arg: Country) => {
      try {
        await _setSelectedCountry(arg);
        await _updateSelectedCountry(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (selectedCountry) Error saving data: ${e} [${JSON.stringify(arg)}]`);
        throw new Error('Error setting selectedCountry');
      }
    },
    [_setSelectedCountry, _updateSelectedCountry],
  );

  return (
    <AppContext.Provider
      value={{
        hideBalance,
        onboarding,
        isDataLoaded,
        seedPhrase,
        selectedCountry,
        setHideBalance,
        setOnboarding,
        resetAppData,
        setSeedPhrase,
        setSelectedCountry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
