import * as ScreenCapture from 'expo-screen-capture';
import { useContext, useEffect } from 'react';
import { Platform } from 'react-native';

import { AppContext } from '@/lib/context/app-context-provider';

async function allowScreenCapture() {
  await ScreenCapture.allowScreenCaptureAsync();
  if (Platform.OS === 'ios') {
    await ScreenCapture.disableAppSwitcherProtectionAsync();
  }
}

async function preventScreenCapture() {
  await ScreenCapture.preventScreenCaptureAsync();
  if (Platform.OS === 'ios') {
    await ScreenCapture.enableAppSwitcherProtectionAsync();
  }
}

export function ScreenCaptureGuard() {
  const { preventScreenCapture: isPreventScreenCaptureEnabled, isDataLoaded } = useContext(AppContext);

  useEffect(() => {
    if (Platform.OS === 'web' || !isDataLoaded) {
      return;
    }

    const sync = async () => {
      if (isPreventScreenCaptureEnabled) {
        await preventScreenCapture();
      } else {
        await allowScreenCapture();
      }
    };

    sync().catch(console.error);

    return () => {
      allowScreenCapture().catch(console.error);
    };
  }, [isPreventScreenCaptureEnabled, isDataLoaded]);

  return null;
}
