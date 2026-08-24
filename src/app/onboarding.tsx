import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button, colors, FocusAwareStatusBar, Image, SafeAreaView, Text } from '@/components/ui';
import { requestNotificationPermissions } from '@/lib/notifications/register-device';
import { theme } from '@/lib/theme-classes';

const Logo = memo(() => <Image className="size-32" source={require('@/assets/images/logo.png')} />);

const WelcomeText = memo(() => {
  const { t } = useTranslation();
  return (
    <>
      <Text testID="onboarding-title" className={`mt-5 text-center text-3xl font-bold ${theme.textPrimary}`}>
        {t('onboarding.title')}
      </Text>
      <Text testID="onboarding-subtitle" className={`mt-4 text-center ${theme.textSecondary}`}>
        {t('onboarding.subtitle')}
      </Text>
    </>
  );
});

interface FooterProps {
  onGetStarted: () => void;
  loading?: boolean;
}

const Footer = memo(({ onGetStarted, loading }: FooterProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Button testID="onboarding-get-started" label={t('onboarding.getStarted')} onPress={onGetStarted} loading={loading} fullWidth variant="secondary" textClassName="text-base text-white" size="lg" />
      <Text testID="onboarding-agreement-text" className={`my-4 text-center ${theme.textSecondary}`}>
        {t('onboarding.agreementText')}{' '}
        <Text testID="onboarding-terms-text" className="font-semibold text-primary-600 underline dark:text-primary-400">
          {t('onboarding.termsOfService')}
        </Text>{' '}
        &{' '}
        <Text testID="onboarding-privacy-text" className="font-semibold text-primary-600 underline dark:text-primary-400">
          {t('onboarding.privacyPolicy')}
        </Text>
      </Text>
    </>
  );
});

function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const helpIconColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];
  const [isContinuing, setIsContinuing] = useState(false);

  const handleGetStarted = React.useCallback(async () => {
    if (isContinuing) return;

    setIsContinuing(true);
    try {
      // Prompt only if the OS can still ask; if already refused, continue without blocking
      await requestNotificationPermissions();
    } catch (error) {
      console.warn('[onboarding] Notification permission request failed', error);
    } finally {
      router.push('/auth/create-or-import-seed');
      setIsContinuing(false);
    }
  }, [isContinuing, router]);

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="onboarding-screen" className={`flex-1 ${theme.screen}`}>
        <View testID="onboarding-content" className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerShown: false,
              headerTitle: '',
              headerShadowVisible: false,
            }}
          />
          <FocusAwareStatusBar />

          <View className="my-2 flex flex-row items-center justify-between">
            <View className="flex" />
            <Pressable testID="onboarding-help" className="relative" onPress={() => router.push('/need-help')} accessibilityLabel={t('onboarding.help')}>
              <Ionicons name="chatbubble-ellipses" size={24} color={helpIconColor} />
              <View className="absolute -right-0.5 -top-0.5 size-3 items-center justify-center rounded-full bg-primary-600" />
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
            <Footer onGetStarted={handleGetStarted} loading={isContinuing} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default memo(Onboarding);
