/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { colors } from '@/components/ui';
import { initializeLanguage } from '@/lib';
import { AppContext } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';

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
  const { isInitialized, initializeBreez } = useBreez();
  const splashHiddenRef = useRef(false);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  const hideSplash = useCallback(async () => {
    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        await initializeLanguage();
      } catch (error) {
        console.error('Error initializing language:', error);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  useEffect(() => {
    if (isDataLoaded && seedPhrase && seedPhrase.length > 0 && !isInitialized) {
      initializeBreez();
    }
  }, [isDataLoaded, seedPhrase, isInitialized, initializeBreez]);

  useEffect(() => {
    if (isDataLoaded && isLanguageLoaded) {
      if (seedPhrase?.length === 0) {
        hideSplash();
      } else {
        const timer = setTimeout(hideSplash, SPLASH_HIDE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [hideSplash, isDataLoaded, isLanguageLoaded, seedPhrase?.length]);

  useEffect(() => {
    return () => {
      if (!splashHiddenRef.current) {
        hideSplash();
      }
    };
  }, [hideSplash]);

  if (!isDataLoaded || !isLanguageLoaded) {
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
