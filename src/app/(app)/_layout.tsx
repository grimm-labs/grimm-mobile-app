import { Ionicons } from '@expo/vector-icons';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { memo, useCallback, useContext, useEffect, useRef } from 'react';

import { colors } from '@/components/ui';
import { AppContext } from '@/lib/context';

const SPLASH_HIDE_DELAY = 1000;

interface TabBarIconProps {
  name: string;
  color: string;
}

const TabBarIcon = memo(({ name, color }: TabBarIconProps) => <Ionicons name={name as React.ComponentProps<typeof Ionicons>['name']} size={24} color={color} />);

const TAB_CONFIG: Array<{ name: string; title: string; iconName: React.ComponentProps<typeof Ionicons>['name'] }> = [
  {
    name: 'index',
    title: 'Home',
    iconName: 'home',
  },
  {
    name: 'transactions',
    title: 'Transactions',
    iconName: 'receipt',
  },
  {
    name: 'settings',
    title: 'Settings',
    iconName: 'settings',
  },
];

const tabBarIcon =
  (iconName: string) =>
  ({ color }: { color: string }) => <TabBarIcon name={iconName} color={color} />;

const TabLayout = () => {
  const { isDataLoaded, seedPhrase } = useContext(AppContext);
  const splashHiddenRef = useRef(false);

  const hideSplash = useCallback(async () => {
    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      if (seedPhrase?.length === 0) {
        hideSplash();
      } else {
        const timer = setTimeout(hideSplash, SPLASH_HIDE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [hideSplash, isDataLoaded, seedPhrase?.length]);

  useEffect(() => {
    return () => {
      if (!splashHiddenRef.current) {
        hideSplash();
      }
    };
  }, [hideSplash]);

  if (!isDataLoaded) {
    return null;
  }

  if (seedPhrase?.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={() => ({
        tabBarActiveTintColor: colors.primary[600],
      })}
    >
      {TAB_CONFIG.map(({ name, title, iconName }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: tabBarIcon(iconName),
            headerShown: false,
            title,
          }}
        />
      ))}
    </Tabs>
  );
};

export default memo(TabLayout);
