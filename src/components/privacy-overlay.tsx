/* eslint-disable react-native/no-inline-styles */
import * as ScreenCapture from 'expo-screen-capture';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { useLayoutEffect, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState, Modal, Platform, StyleSheet, View } from 'react-native';

import { Image } from '@/components/ui/image';
import { getSplashAppearance, SPLASH_IMAGE_WIDTH } from '@/lib/splash-appearance';

function isAppInBackground(appState: AppStateStatus) {
  return appState === 'inactive' || appState === 'background';
}

type SplashContentProps = {
  backgroundColor: string;
  image: number;
};

function SplashContent({ backgroundColor, image }: SplashContentProps) {
  return (
    <View style={[styles.content, { backgroundColor }]} testID="privacy-overlay">
      <Image source={image} style={styles.logo} contentFit="contain" />
    </View>
  );
}

export function PrivacyOverlay() {
  const { colorScheme } = useColorScheme();
  const [isVisible, setIsVisible] = useState(() => isAppInBackground(AppState.currentState));

  useLayoutEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    // Android captures the recents snapshot before JS can paint an overlay.
    // FLAG_SECURE blanks the task switcher preview at the native layer.
    if (Platform.OS === 'android') {
      ScreenCapture.preventScreenCaptureAsync().catch(console.error);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsVisible(isAppInBackground(nextAppState));
    };

    setIsVisible(isAppInBackground(AppState.currentState));

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  if (Platform.OS === 'web') {
    return null;
  }

  const { backgroundColor, image } = getSplashAppearance(colorScheme);

  if (Platform.OS === 'android') {
    return (
      <Modal visible={isVisible} animationType="none" transparent={false} statusBarTranslucent hardwareAccelerated onRequestClose={() => undefined}>
        <SplashContent backgroundColor={backgroundColor} image={image} />
      </Modal>
    );
  }

  return (
    <View pointerEvents="none" style={[styles.overlay, { backgroundColor, opacity: isVisible ? 1 : 0 }]} testID="privacy-overlay">
      <Image source={image} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SPLASH_IMAGE_WIDTH,
    height: SPLASH_IMAGE_WIDTH,
  },
});
