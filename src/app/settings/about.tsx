/* eslint-disable max-lines-per-function */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Application from 'expo-application';
import { Stack } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Image, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { Env } from '@/lib/env';

const Logo = memo(() => <Image className="size-28" source={require('@/assets/images/logo.png')} />);

interface AboutItemProps {
  title: string;
  onPress: () => void;
}

const AboutItem = React.memo<AboutItemProps>(({ title, onPress }) => (
  <Pressable onPress={onPress} style={{ opacity: 1 }}>
    <View className="mb-3 flex min-h-[60px] flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
      <Text className="text-base font-medium text-gray-900">{title}</Text>
      <Ionicons name="open-outline" size={20} color={colors.neutral[500]} />
    </View>
  </Pressable>
));

AboutItem.displayName = 'AboutItem';

export default function AboutScreen() {
  const { t } = useTranslation();

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('about.error_title'), t('about.error_unable_link', { url }));
      }
    } catch (error) {
      Alert.alert(t('about.error_title'), t('about.error_generic'));
      console.error('Error opening URL:', error);
    }
  };

  const handleRateApp = async () => {
    try {
      if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction()) && Platform.OS === 'ios') {
        await StoreReview.requestReview();
      } else {
        const storeUrl = Platform.select({
          ios: 'itms-apps://itunes.apple.com/app/viewContentsUserReviews/id6754340143?action=write-review',
          android: `market://details?id=${Env.BUNDLE_ID}&showAllReviews=true`,
        });

        if (storeUrl) {
          await openURL(storeUrl);
        }
      }
    } catch (error) {
      Alert.alert(t('about.error_title'), t('about.error_rating'));
      console.error('Error requesting review:', error);
    }
  };

  const handleTermsPress = () => openURL('https://usegrimm.app/terms');
  const handlePrivacyPress = () => openURL('https://usegrimm.app/privacy');
  const handleWebsitePress = () => openURL('https://usegrimm.app');

  const screenOptions = useMemo(
    () => ({
      headerTitle: () => <HeaderTitle title={t('about.header_title')} />,
      headerTitleAlign: 'center' as const,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex h-full">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar style="dark" />
          <View className="items-center justify-center py-12">
            <View className="mb-6 items-center">
              <View className="mb-8 size-20 items-center justify-center rounded-full bg-white" style={{ backgroundColor: '#ffffff' }}>
                <Logo />
              </View>
              <Text className="my-6 text-2xl font-bold text-gray-600">Grimm App</Text>
              <Text className="text-base text-gray-400">
                {t('about.version', { version: Env.VERSION })} {Application.nativeBuildVersion ? `(${Application.nativeBuildVersion})` : null}
              </Text>
            </View>
          </View>
          <View className="flex-1 px-4">
            <AboutItem title={t('about.rate_our_app')} onPress={handleRateApp} />
            <AboutItem title={t('about.terms_of_service')} onPress={handleTermsPress} />
            <AboutItem title={t('about.privacy_policy')} onPress={handlePrivacyPress} />
            <AboutItem title={t('about.visit_website')} onPress={handleWebsitePress} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
