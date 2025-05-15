import * as SecureStore from 'expo-secure-store';
import { useCallback } from 'react';

export const useSecureStorage = (key: string) => {
  const getItem = useCallback(async () => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] Error getting ${key}:`, error);
      return null;
    }
  }, [key]);

  const setItem = useCallback(
    async (value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error(`[SecureStore] Error setting ${key}:`, error);
        throw error;
      }
    },
    [key],
  );

  return { getItem, setItem };
};
