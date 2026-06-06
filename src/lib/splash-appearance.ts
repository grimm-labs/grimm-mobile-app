import type { ColorSchemeName } from 'react-native';

export const SPLASH_IMAGE_WIDTH = 150;

export const SPLASH_APPEARANCE = {
  light: {
    backgroundColor: '#ffffff',
    image: require('../../assets/icons/splash-icon-dark.png'),
  },
  dark: {
    backgroundColor: '#000000',
    image: require('../../assets/icons/splash-icon-light.png'),
  },
} as const;

export function getSplashAppearance(colorScheme: ColorSchemeName | null | undefined) {
  return colorScheme === 'dark' ? SPLASH_APPEARANCE.dark : SPLASH_APPEARANCE.light;
}
