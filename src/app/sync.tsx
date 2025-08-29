/* eslint-disable max-lines-per-function */
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export default function Sync() {
  const { t } = useTranslation();
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState(t('sync.status.initializing'));

  const pulseAnim = React.useMemo(() => new Animated.Value(1), []);
  const progressAnim = React.useMemo(() => new Animated.Value(0), []);
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 20;

        if (newProgress <= 20) {
          setSyncStatus(t('sync.status.connecting'));
        } else if (newProgress <= 40) {
          setSyncStatus(t('sync.status.fetching'));
        } else if (newProgress <= 60) {
          setSyncStatus(t('sync.status.processing'));
        } else if (newProgress <= 80) {
          setSyncStatus(t('sync.status.finalizing'));
        } else if (newProgress >= 100) {
          setSyncStatus(t('sync.status.completed'));

          setTimeout(() => {
            router.replace('/');
          }, 500);
        }

        return newProgress;
      });
    }, 1000);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    return () => {
      clearInterval(timer);
      pulseAnimation.stop();
    };
  }, [fadeAnim, progressAnim, pulseAnim, router, t]);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <View className="h-full flex-1 justify-between px-6">
          <Stack.Screen
            options={{
              headerShown: false,
              headerTitle: '',
              headerLeft: HeaderLeft,
              headerRight: () => null,
              headerShadowVisible: false,
            }}
          />
          <FocusAwareStatusBar style="dark" />

          <Animated.View className="flex-1 items-center justify-center" style={{ opacity: fadeAnim }}>
            <View className="mb-8 items-center">
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                }}
                className="mb-6 size-20 items-center justify-center rounded-full"
              >
                <ActivityIndicator size="large" color={colors.primary[600]} />
              </Animated.View>

              <Text className="mb-2 text-2xl font-bold text-gray-900">{t('sync.title')}</Text>
              <Text className="text-center text-base text-gray-600">{syncStatus}</Text>
            </View>

            <View className="px-6">
              <Text className="text-center text-sm leading-5 text-gray-500">
                {t('sync.description.line1')}
                {'\n'}
                {t('sync.description.line2')}
              </Text>
            </View>
          </Animated.View>

          <View className="items-center pb-8">
            <View className="flex-row space-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                <View key={step} className={`mx-1 size-2 rounded-full ${progress >= step * 10 ? 'bg-primary-600' : 'bg-blue-200'}`} />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
