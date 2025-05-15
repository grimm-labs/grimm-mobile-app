import { Ionicons } from '@expo/vector-icons';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { memo, useCallback, useContext, useEffect } from 'react';

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

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      const timer = setTimeout(hideSplash, SPLASH_HIDE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, isDataLoaded]);

  // Return null during loading to avoid rendering partial UI
  if (!isDataLoaded) {
    return null;
  }

  if (!seedPhrase?.length) {
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
