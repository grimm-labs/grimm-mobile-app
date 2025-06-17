/* eslint-disable max-lines-per-function */
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import type { Country, User } from '@/interfaces';
import { useSecureStorage } from '@/lib/hooks';
import { BitcoinUnit } from '@/types/enum';

import type { TokenType } from '../auth/utils';

type Props = PropsWithChildren<{}>;

type defaultContextType = {
  hideBalance: boolean;
  onboarding: boolean;
  isDataLoaded: boolean;
  seedPhrase: string;
  isSeedPhraseBackup: boolean;
  selectedCountry: Country;
  userToken: TokenType | null;
  user: User | null;
  bitcoinUnit: BitcoinUnit; // Ajout de l'unité Bitcoin
  setHideBalance: (hideBalance: boolean) => void;
  setOnboarding: (onboarding: boolean) => void;
  resetAppData: () => void;
  setSeedPhrase: (seedPhrase: string) => void;
  setIsSeedPhraseBackup: (isSeedPhraseBackup: boolean) => void;
  setSelectedCountry: (country: Country) => void;
  setUserToken: (token: TokenType | null) => void;
  setUser: (user: User | null) => void;
  setBitcoinUnit: (unit: BitcoinUnit) => void; // Setter pour l'unité Bitcoin
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
  userToken: null,
  user: null,
  bitcoinUnit: BitcoinUnit.Sats,
  setHideBalance: () => {},
  setOnboarding: () => {},
  resetAppData: () => {},
  setSeedPhrase: () => {},
  setIsSeedPhraseBackup: () => {},
  setSelectedCountry: () => {},
  setUserToken: () => {},
  setUser: () => {},
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
  const [userToken, _setUserToken] = useState<TokenType | null>(defaultContext.userToken);
  const [user, _setUser] = useState<User | null>(defaultContext.user);
  const [bitcoinUnit, _setBitcoinUnit] = useState<BitcoinUnit>(defaultContext.bitcoinUnit);

  const { getItem: _getHideBalance, setItem: _updateHideBalance } = useAsyncStorage('hideBalance');
  const { getItem: _getOnboarding, setItem: _updateOnboarding } = useAsyncStorage('onboarding');
  const { getItem: _getSelectedCountry, setItem: _updateSelectedCountry } = useAsyncStorage('selectedCountry');
  const { getItem: _getSeedPhrase, setItem: _updateSeedPhrase } = useSecureStorage('seedPhrase');
  const { getItem: _getIsSeedPhraseBackup, setItem: _updateIsSeedPhraseBackup } = useAsyncStorage('isSeedPhraseBackup');
  const { getItem: _getUserToken, setItem: _updateUserToken } = useAsyncStorage('userToken');
  const { getItem: _getUser, setItem: _updateUser } = useAsyncStorage('user');
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

  const _loadUserToken = useCallback(async () => {
    const ob = await _getUserToken();
    if (ob !== null) {
      _setUserToken(JSON.parse(ob));
    }
  }, [_getUserToken, _setUserToken]);

  const _loadUser = useCallback(async () => {
    const ob = await _getUser();
    if (ob !== null) {
      _setUser(JSON.parse(ob));
    }
  }, [_getUser, _setUser]);

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
        await Promise.all([_loadHideBalance(), _loadOnboarding(), _loadSelectedCountry(), _loadUserToken(), _loadUser(), _loadSeedPhrase(), _loadIsSeedPhraseBackup(), _loadBitcoinUnit()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        _setIsDataLoaded(true);
      }
    };

    loadData();
  }, [_loadHideBalance, _loadOnboarding, _loadSelectedCountry, _loadUserToken, _loadUser, _loadSeedPhrase, _loadIsSeedPhraseBackup, _loadBitcoinUnit]);

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

  const setUserToken = useCallback(
    async (arg: TokenType | null) => {
      try {
        await _setUserToken(arg);
        await _updateUserToken(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (userToken) Error saving data: ${e} [${JSON.stringify(arg)}]`);
        throw new Error('Error setting userToken');
      }
    },
    [_setUserToken, _updateUserToken],
  );

  const setUser = useCallback(
    async (arg: User | null) => {
      try {
        await _setUser(arg);
        await _updateUser(JSON.stringify(arg));
      } catch (e) {
        console.error(`[AsyncStorage] (user) Error saving data: ${e} [${JSON.stringify(arg)}]`);
        throw new Error('Error setting user');
      }
    },
    [_setUser, _updateUser],
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
      await setUserToken(null);
      await setUser(null);
      await setSeedPhrase('');
      await setIsSeedPhraseBackup(false);
      await setBitcoinUnit(BitcoinUnit.Sats);
    } catch (e) {
      console.error(`[AsyncStorage] (Reset app data) Error loading data: ${e}`);
      throw new Error('Unable to reset app data');
    }
  }, [setOnboarding, setUserToken, setUser, setSeedPhrase, setIsSeedPhraseBackup, setBitcoinUnit]);

  return (
    <AppContext.Provider
      value={{
        hideBalance,
        onboarding,
        isDataLoaded,
        seedPhrase,
        isSeedPhraseBackup,
        selectedCountry,
        userToken,
        user,
        bitcoinUnit,
        setHideBalance,
        setOnboarding,
        resetAppData,
        setSeedPhrase,
        setIsSeedPhraseBackup,
        setSelectedCountry,
        setUserToken,
        setUser,
        setBitcoinUnit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
