/* eslint-disable react-hooks/exhaustive-deps */
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import React, { createContext, useCallback, useEffect, useState } from 'react';

type Props = PropsWithChildren<{}>;

type defaultContextType = {
  hideBalance: boolean;
  onboarding: boolean;
  setHideBalance: (hideBalance: boolean) => void;
  setOnboarding: (onboarding: boolean) => void;
  resetAppData: () => void;
};

const defaultContext: defaultContextType = {
  hideBalance: false,
  onboarding: false,
  setHideBalance: () => {},
  setOnboarding: () => {},
  resetAppData: () => {},
};

export const AppContext = createContext<defaultContextType>(defaultContext);

export const AppContextProvider = ({ children }: Props) => {
  const [hideBalance, _setHideBalance] = useState(defaultContext.hideBalance);
  const [onboarding, _setOnboarding] = useState(defaultContext.onboarding);

  const { getItem: _getHideBalance, setItem: _updateHideBalance } = useAsyncStorage('hideBalance');
  const { getItem: _getOnboarding, setItem: _updateOnboarding } = useAsyncStorage('onboarding');

  const _loadHideBalance = async () => {
    const ob = await _getHideBalance();
    if (ob !== null) {
      _setHideBalance(JSON.parse(ob));
    }
  };

  const _loadOnboarding = async () => {
    const ob = await _getOnboarding();
    if (ob !== null) {
      _setOnboarding(JSON.parse(ob));
    }
  };

  useEffect(() => {
    _loadHideBalance();
    _loadOnboarding();
  }, []);

  const resetAppData = useCallback(async () => {
    try {
      await setOnboarding(true);
    } catch (e) {
      console.error(`[AsyncStorage] (Reset app data) Error loading data: ${e}`);

      throw new Error('Unable to reset app data');
    }
  }, []);

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
    [_setOnboarding, _updateOnboarding]
  );

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
    [_setHideBalance, _updateHideBalance]
  );

  return <AppContext.Provider value={{ hideBalance, onboarding, setHideBalance, setOnboarding, resetAppData }}>{children}</AppContext.Provider>;
};
