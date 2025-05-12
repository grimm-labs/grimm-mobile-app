/* eslint-disable react/no-unstable-nested-components */
import { Stack, useRouter } from 'expo-router';
import React, { memo } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import HelpButton from '@/components/help-button';
import { Button, FocusAwareStatusBar, Image } from '@/components/ui';

const Logo = memo(() => <Image className="size-32" source={require('@/assets/images/logo.png')} />);

const WelcomeText = memo(() => (
  <>
    <Text className="mt-5 text-center text-3xl">Welcome to Grimm App</Text>
    <Text className="mt-4 text-center text-gray-700">The next-gen self-custodial Bitcoin SuperApp for seamless On-chain & Lightning payments.</Text>
  </>
));

interface FooterProps {
  onGetStarted: () => void;
}

const Footer = memo(({ onGetStarted }: FooterProps) => (
  <>
    <Button label="Get Started" onPress={onGetStarted} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
    <Text className="mt-4 text-center text-gray-700">
      By Continuing, You agree to the <Text className="font-semibold text-success-600 underline">Terms of Service</Text> & <Text className="font-semibold text-success-600 underline">Privacy Policy</Text>
    </Text>
  </>
));

function Onboarding() {
  const router = useRouter();

  const handleGetStarted = React.useCallback(() => {
    router.push('/auth/sign-in');
  }, [router]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: '',
            headerLeft: () => null,
            headerRight: () => <HelpButton />,
            headerShadowVisible: false,
          }}
        />

        <FocusAwareStatusBar style="dark" />

        <View className="flex-1">
          <View className="flex-1 items-center justify-center">
            <Logo />
          </View>
          <View className="items-center justify-end pb-6">
            <WelcomeText />
          </View>
        </View>

        <View className="mb-4">
          <Footer onGetStarted={handleGetStarted} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default memo(Onboarding);
