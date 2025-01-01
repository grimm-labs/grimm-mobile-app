/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect } from 'react';

import { useSeedPhrase } from '@/core/hooks/use-seed-phrase';

export default function TabLayout() {
  const [seedPhrase, _setSeedPhrase] = useSeedPhrase();

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      hideSplash();
    }, 1000);
  }, [hideSplash]);

  if (seedPhrase?.length === 0) {
    console.log(seedPhrase);
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
          tabBarTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="pie-chart" size={26} color={color} />
          ),
          tabBarTestID: 'activity-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="cog" size={26} color={color} />
          ),
          tabBarTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}
