import { useIsFocused } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

type StatusBarStyle = 'light' | 'dark';

type Props = {
  hidden?: boolean;
  /** Status bar icon/text color. Defaults to dark icons in light mode, light icons in dark mode. */
  style?: StatusBarStyle | null;
};

export const FocusAwareStatusBar = ({ hidden = false, style }: Props) => {
  const isFocused = useIsFocused();
  const { colorScheme } = useColorScheme();

  if (Platform.OS === 'web') return null;

  const statusBarStyle: StatusBarStyle = style ?? (colorScheme === 'dark' ? 'light' : 'dark');

  return isFocused ? <SystemBars style={statusBarStyle} hidden={hidden} /> : null;
};
