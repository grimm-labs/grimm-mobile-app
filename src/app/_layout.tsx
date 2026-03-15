// Import  global CSS file
import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { APIProvider } from '@/api';
import { WalletErrorBoundary } from '@/components/wallet-error-boundary';
import { loadSelectedTheme } from '@/lib';
import { AppContextProvider, BdkProvider, BitcoinPriceProvider, BreezProvider } from '@/lib/context';
import { useThemeConfig } from '@/lib/use-theme-config';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();

  return (
    <AppContextProvider>
      <WalletErrorBoundary name="Lightning (Breez)">
        <BreezProvider>
          <GestureHandlerRootView style={styles.container} className={theme.dark ? `dark` : undefined}>
            <KeyboardProvider>
              <ThemeProvider value={theme}>
                <APIProvider>
                  <BitcoinPriceProvider>
                    <WalletErrorBoundary name="On-chain (BDK)">
                      <BdkProvider>
                        <BottomSheetModalProvider>
                          {children}
                          <FlashMessage position="top" />
                        </BottomSheetModalProvider>
                      </BdkProvider>
                    </WalletErrorBoundary>
                  </BitcoinPriceProvider>
                </APIProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </BreezProvider>
      </WalletErrorBoundary>
    </AppContextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
