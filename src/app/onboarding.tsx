import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button, colors, FocusAwareStatusBar, Image, SafeAreaView } from '@/components/ui';

const Logo = memo(() => <Image className="size-32" source={require('@/assets/images/logo.png')} />);

const WelcomeText = memo(() => {
  const { t } = useTranslation();
  return (
    <>
      <Text className="mt-5 text-center text-3xl">{t('onboarding.title')}</Text>
      <Text className="mt-4 text-center text-gray-700">{t('onboarding.subtitle')}</Text>
    </>
  );
});

interface FooterProps {
  onGetStarted: () => void;
}

const Footer = memo(({ onGetStarted }: FooterProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Button label={t('onboarding.getStarted')} onPress={onGetStarted} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
      <Text className="my-4 text-center text-gray-700">
        {t('onboarding.agreementText')} <Text className="font-semibold text-primary-600 underline">{t('onboarding.termsOfService')}</Text> &{' '}
        <Text className="font-semibold text-primary-600 underline">{t('onboarding.privacyPolicy')}</Text>
      </Text>
    </>
  );
});

function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleGetStarted = React.useCallback(() => {
    router.push('/auth/create-or-import-seed');
  }, [router]);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1">
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerShown: false,
              headerTitle: '',
              headerShadowVisible: false,
            }}
          />
          <FocusAwareStatusBar style="dark" />

          <View className="my-2 flex flex-row items-center justify-between">
            <View className="flex" />
            <Pressable className="relative" onPress={() => router.push('/need-help')} accessibilityLabel={t('onboarding.help')}>
              <Ionicons name="chatbubble-ellipses" size={24} color={colors.neutral[500]} />
              <View className="-top-0,5 absolute -right-0.5 size-3 items-center justify-center rounded-full bg-primary-600" />
            </Pressable>
          </View>

          <View className="flex-1">
            <View className="flex-1 items-center justify-center">
              <Logo />
            </View>
            <View className="items-center justify-end pb-6">
              <WelcomeText />
            </View>
          </View>
          <View>
            <Footer onGetStarted={handleGetStarted} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default memo(Onboarding);
