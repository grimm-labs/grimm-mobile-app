import { create } from 'zustand';

import { getItem } from '../storage';
import { createSelectors } from '../utils';

export type NetworkType = 'mainnet' | 'testnet';

export type SettingsType = {
  network: NetworkType;
};

const SETTINGS_KEY = 'SETTINGS_KEY';

interface SettingsState {
  network: NetworkType;
  setNetwork: (value: NetworkType) => void;
  hydrate: () => void;
}

const _useSettings = create<SettingsState>((set, get) => ({
  network: 'testnet',
  setNetwork: (value: NetworkType) => {
    // setToken(token);
    set({ network: value });
  },
  hydrate: () => {
    try {
      const settings = getItem<SettingsState>(SETTINGS_KEY);
      if (settings !== null) {
        const { network } = settings;
        get().setNetwork(network);
      }
    } catch (e) {
      // catch error here
      // Maybe sign_out user!
    }
  },
}));

export const useSettings = createSelectors(_useSettings);
export const setNetwork = (value: NetworkType) => _useSettings.getState().setNetwork(value);
export const hydrateSettings = () => _useSettings.getState().hydrate();
