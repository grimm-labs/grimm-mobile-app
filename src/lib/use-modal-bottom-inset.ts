import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Offset bottom sheets above the tab bar (or system safe area on stack screens). */
export function useModalBottomInset() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = React.useContext(BottomTabBarHeightContext);

  return React.useMemo(() => {
    if (tabBarHeight != null && tabBarHeight > 0) {
      return tabBarHeight;
    }

    return insets.bottom;
  }, [insets.bottom, tabBarHeight]);
}
