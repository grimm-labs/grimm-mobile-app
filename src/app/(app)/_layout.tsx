/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { colors } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';

const SPLASH_HIDE_DELAY = 1000;

interface TabBarIconProps {
  name: string;
  color: string;
}

const TabBarIcon = memo(({ name, color }: TabBarIconProps) => <Ionicons name={name as React.ComponentProps<typeof Ionicons>['name']} size={24} color={color} />);

const TAB_CONFIG: Array<{ name: string; title: string; iconName: React.ComponentProps<typeof Ionicons>['name']; showForCountries?: string[] }> = [
  {
    name: 'index',
    title: 'Home',
    iconName: 'home',
  },
  {
    name: 'pay',
    title: 'Pay Bills',
    iconName: 'flash',
    showForCountries: ['CM'],
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
  const { isDataLoaded, seedPhrase, user, selectedCountry } = useContext(AppContext);
  const { isInitialized, initializeBreez } = useBreez();
  const splashHiddenRef = useRef(false);

  const hideSplash = useCallback(async () => {
    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      await SplashScreen.hideAsync();
    }
  }, []);

  const filteredTabs = useMemo(() => {
    return TAB_CONFIG.filter((tab) => {
      if (!tab.showForCountries) return true;
      return tab.showForCountries.includes(selectedCountry?.isoCode || '');
    });
  }, [selectedCountry]);

  // Créer un set des noms d'onglets visibles pour faciliter la vérification
  const visibleTabNames = useMemo(() => {
    return new Set(filteredTabs.map((tab) => tab.name));
  }, [filteredTabs]);

  useEffect(() => {
    if (isDataLoaded && user && seedPhrase && seedPhrase.length > 0 && !isInitialized) {
      initializeBreez();
    }
  }, [isDataLoaded, user, seedPhrase, isInitialized, initializeBreez]);

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

  if (!user || seedPhrase?.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={() => ({
        tabBarActiveTintColor: colors.primary[600],
      })}
    >
      {/* Définir explicitement tous les onglets, même ceux cachés */}
      {TAB_CONFIG.map(({ name, title, iconName }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: tabBarIcon(iconName),
            headerShown: false,
            title,
            // Cacher l'onglet de la navigation si non visible
            href: visibleTabNames.has(name) ? undefined : null,
          }}
        />
      ))}
    </Tabs>
  );
};

export default memo(TabLayout);
