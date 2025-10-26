import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme, useColorScheme } from 'nativewind';
import React from 'react';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

/**
 * this hooks should only be used while selecting the theme
 * This hooks will return the selected theme which is stored in AsyncStorage
 * selectedTheme should be one of the following values 'light', 'dark' or 'system'
 * don't use this hooks if you want to use it to style your component based on the theme use useColorScheme from nativewind instead
 *
 */
export const useSelectedTheme = () => {
  const { colorScheme: _color, setColorScheme } = useColorScheme();
  const [theme, setTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(SELECTED_THEME);
        setTheme(storedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const setSelectedTheme = React.useCallback(
    async (t: ColorSchemeType) => {
      try {
        await AsyncStorage.setItem(SELECTED_THEME, t);
        setColorScheme(t);
        setTheme(t);
      } catch (error) {
        console.error('Error setting theme:', error);
      }
    },
    [setColorScheme],
  );

  const selectedTheme = (theme ?? 'system') as ColorSchemeType;
  return { selectedTheme, setSelectedTheme } as const;
};

// to be used in the root file to load the selected theme from AsyncStorage
export const loadSelectedTheme = async () => {
  try {
    const theme = await AsyncStorage.getItem(SELECTED_THEME);
    if (theme !== null) {
      colorScheme.set(theme as ColorSchemeType);
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
};
