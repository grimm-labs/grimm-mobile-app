/* eslint-disable max-lines-per-function */
import fs from 'node:fs';

import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { ClientEnv, Env } from './env.js';

const GOOGLE_SERVICES_CREDENTIALS_PATH = './credentials/firebase/google-services.json';
const GOOGLE_SERVICES_LEGACY_PATH = './google-services.json';

function resolveGoogleServicesFile(): string | undefined {
  if (fs.existsSync('./credentials/firebase/google-services.json')) {
    return GOOGLE_SERVICES_CREDENTIALS_PATH;
  }

  if (fs.existsSync('./google-services.json')) {
    console.warn('[app.config] Using legacy google-services.json at project root. Prefer credentials/firebase/google-services.json');

    return GOOGLE_SERVICES_LEGACY_PATH;
  }

  return undefined;
}

const googleServicesFile = resolveGoogleServicesFile();

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.APP_ENV !== 'production' && !process.env.CI,
  badges: [
    {
      text: Env.APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME}`,
  owner: Env.EXPO_ACCOUNT_OWNER,
  scheme: Env.SCHEME,
  slug: 'grimm-app',
  version: Env.VERSION.toString(),
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: Env.BUNDLE_ID,
    config: {
      usesNonExemptEncryption: false, // Avoid the export compliance warning on the app store
    },
    icon: {
      light: './assets/icons/ios-light.png',
      dark: './assets/icons/ios-dark.png',
      tinted: './assets/icons/ios-tinted.png',
    },
    infoPlist: {
      NSCameraUsageDescription: 'This app uses the camera to scan QR codes',
      CFBundleURLTypes: [{ CFBundleURLSchemes: [Env.SCHEME] }, { CFBundleURLSchemes: ['lightning'] }],
      UIBackgroundModes: ['remote-notification'],
    },
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icons/adaptive-icon.png',
      monochromeImage: './assets/icons/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: Env.PACKAGE,
    ...(googleServicesFile ? { googleServicesFile } : {}),
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: false,
        data: [{ scheme: 'lightning' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          useLegacyPackaging: true,
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/icons/splash-icon-dark.png',
        imageWidth: 150,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#000000',
          image: './assets/icons/splash-icon-light.png',
        },
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Roboto/Roboto-Black.ttf',
          './assets/fonts/Roboto/Roboto-BlackItalic.ttf',
          './assets/fonts/Roboto/Roboto-Bold.ttf',
          './assets/fonts/Roboto/Roboto-BoldItalic.ttf',
          './assets/fonts/Roboto/Roboto-Italic.ttf',
          './assets/fonts/Roboto/Roboto-Light.ttf',
          './assets/fonts/Roboto/Roboto-LightItalic.ttf',
          './assets/fonts/Roboto/Roboto-Medium.ttf',
          './assets/fonts/Roboto/Roboto-MediumItalic.ttf',
          './assets/fonts/Roboto/Roboto-Regular.ttf',
          './assets/fonts/Roboto/Roboto-Thin.ttf',
          './assets/fonts/Roboto/Roboto-ThinItalic.ttf',
        ],
      },
    ],
    'expo-localization',
    'expo-router',
    ['app-icon-badge', appIconBadgeConfig],
    ['react-native-edge-to-edge'],
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
        microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icons/notification_icon.png',
        color: '#F7931A',
        sounds: [],
        mode: 'production',
      },
    ],
  ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
  },
});
