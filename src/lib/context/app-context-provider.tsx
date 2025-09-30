/* eslint-disable max-lines-per-function */
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import type { Country } from '@/interfaces';
import { useSecureStorage } from '@/lib/hooks';
import { BitcoinUnit } from '@/types/enum';

type Props = PropsWithChildren<{}>;

type defaultContextType = {
  hideBalance: boolean;
  onboarding: boolean;
  isDataLoaded: boolean;
  seedPhrase: string;
  isSeedPhraseBackup: boolean;
  selectedCountry: Country;
  bitcoinUnit: BitcoinUnit;
  setHideBalance: (hideBalance: boolean) => void;
  setOnboarding: (onboarding: boolean) => void;
  resetAppData: () => void;
  setSeedPhrase: (seedPhrase: string) => void;
  setIsSeedPhraseBackup: (isSeedPhraseBackup: boolean) => void;
  setSelectedCountry: (country: Country) => void;
  setBitcoinUnit: (unit: BitcoinUnit) => void;
};

const defaultContext: defaultContextType = {
  hideBalance: false,
  onboarding: false,
  isDataLoaded: false,
  seedPhrase: '',
  isSeedPhraseBackup: false,
  selectedCountry: {
    currency: 'XAF',
    callingCode: '237',
    region: 'Africa',
    subregion: 'Middle Africa',
    name: 'Cameroon',
    nameFr: 'Cameroun',
    isoCode: 'CM',
  },
  bitcoinUnit: BitcoinUnit.Sats,
  setHideBalance: () => {},
  setOnboarding: () => {},
  resetAppData: () => {},
  setSeedPhrase: () => {},
  setIsSeedPhraseBackup: () => {},
  setSelectedCountry: () => {},
  setBitcoinUnit: () => {},
};

export const AppContext = createContext<defaultContextType>(defaultContext);

export const AppContextProvider = ({ children }: Props) => {
  const [hideBalance, _setHideBalance] = useState(defaultContext.hideBalance);
  const [onboarding, _setOnboarding] = useState(defaultContext.onboarding);
  const [isDataLoaded, _setIsDataLoaded] = useState(defaultContext.isDataLoaded);
  const [seedPhrase, _setSeedPhrase] = useState(defaultContext.seedPhrase);
  const [isSeedPhraseBackup, _setIsSeedPhraseBackup] = useState(defaultContext.isSeedPhraseBackup);
  const [selectedCountry, _setSelectedCountry] = useState<Country>(defaultContext.selectedCountry);
  const [bitcoinUnit, _setBitcoinUnit] = useState<BitcoinUnit>(defaultContext.bitcoinUnit);

  const { getItem: _getHideBalance, setItem: _updateHideBalance } = useAsyncStorage('hideBalance');
  const { getItem: _getOnboarding, setItem: _updateOnboarding } = useAsyncStorage('onboarding');
  const { getItem: _getSelectedCountry, setItem: _updateSelectedCountry } = useAsyncStorage('selectedCountry');
  const { getItem: _getSeedPhrase, setItem: _updateSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getIsSeedPhraseBackup, setItem: _updateIsSeedPhraseBackup } = useAsyncStorage('isSeedPhraseBackup');
  const { getItem: _getBitcoinUnit, setItem: _updateBitcoinUnit } = useAsyncStorage('bitcoinUnit');

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

  const _loadIsSeedPhraseBackup = useCallback(async () => {
    const ob = await _getIsSeedPhraseBackup();
    if (ob !== null) {
      _setIsSeedPhraseBackup(JSON.parse(ob));
    }
  }, [_getIsSeedPhraseBackup, _setIsSeedPhraseBackup]);

  const _loadBitcoinUnit = useCallback(async () => {
    const ob = await _getBitcoinUnit();
    if (ob !== null) {
      _setBitcoinUnit(JSON.parse(ob) as BitcoinUnit);
    }
  }, [_getBitcoinUnit, _setBitcoinUnit]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([_loadHideBalance(), _loadOnboarding(), _loadSelectedCountry(), _loadSeedPhrase(), _loadIsSeedPhraseBackup(), _loadBitcoinUnit()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        _setIsDataLoaded(true);
      }
    };

    loadData();
  }, [_loadHideBalance, _loadOnboarding, _loadSelectedCountry, _loadSeedPhrase, _loadIsSeedPhraseBackup, _loadBitcoinUnit]);

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

  const setIsSeedPhraseBackup = useCallback(
    async (arg: boolean) => {
      try {
        await _setIsSeedPhraseBackup(arg);
        await _updateIsSeedPhraseBackup(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (isSeedPhraseBackup) Error saving data: ${e} [${arg}]`);
        throw new Error('Error setting isSeedPhraseBackup');
      }
    },
    [_setIsSeedPhraseBackup, _updateIsSeedPhraseBackup],
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

  const setBitcoinUnit = useCallback(
    async (arg: BitcoinUnit) => {
      try {
        await _setBitcoinUnit(arg);
        await _updateBitcoinUnit(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (bitcoinUnit) Error saving data: ${e} [${arg}]`);
        throw new Error('Error setting bitcoinUnit');
      }
    },
    [_setBitcoinUnit, _updateBitcoinUnit],
  );

  const resetAppData = useCallback(async () => {
    try {
      await setOnboarding(true);
      await setSeedPhrase('');
      await setIsSeedPhraseBackup(false);
      await setBitcoinUnit(BitcoinUnit.Sats);
    } catch (e) {
      console.error(`[AsyncStorage] (Reset app data) Error loading data: ${e}`);
      throw new Error('Unable to reset app data');
    }
  }, [setOnboarding, setSeedPhrase, setIsSeedPhraseBackup, setBitcoinUnit]);

  return (
    <AppContext.Provider
      value={{
        hideBalance,
        onboarding,
        isDataLoaded,
        seedPhrase,
        isSeedPhraseBackup,
        selectedCountry,
        bitcoinUnit,
        setHideBalance,
        setOnboarding,
        resetAppData,
        setSeedPhrase,
        setIsSeedPhraseBackup,
        setSelectedCountry,
        setBitcoinUnit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
