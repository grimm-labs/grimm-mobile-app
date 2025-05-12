import { useIsFocused } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

type ColorSchemeType = 'light' | 'dark';

type Props = {
  hidden?: boolean;
  style?: ColorSchemeType | null;
};

export const FocusAwareStatusBar = ({ hidden = false, style }: Props) => {
  const isFocused = useIsFocused();
  const { colorScheme } = useColorScheme();

  if (Platform.OS === 'web') return null;

  const statusBarStyle = style || (colorScheme as ColorSchemeType);

  return isFocused ? <SystemBars style={statusBarStyle} hidden={hidden} /> : null;
};
