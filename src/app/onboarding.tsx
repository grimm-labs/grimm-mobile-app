import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { Button, FocusAwareStatusBar, Image } from '@/ui';

export default function Onboarding() {
  const router = useRouter();

  return (
    <SafeAreaView>
      <View className="flex h-full justify-between px-4">
        <Stack.Screen
          options={{
            title: '',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="flex-1 items-center justify-center">
          <Image
            source={require('@/assets/images/wallet.jpg')}
            className="h-1/2 w-1/2"
          />
          <Text className="mt-5 text-center text-3xl font-bold">
            Secure. Simple. Seamless.
          </Text>
          <Text className="mt-5 text-center text-3xl">
            Welcome to Grimm Wallet
          </Text>
          <Text className="mt-5 text-center text-lg font-medium text-gray-600">
            Safely store, send, receive, and exchange your tokens effortlessly,
            all in one place.
          </Text>
        </View>
        <View>
          <Button
            label="Get Started"
            onPress={() => {
              router.push('/auth/sign-in');
            }}
            fullWidth={true}
            variant="secondary"
            textClassName="text-base text-white"
            size="lg"
          />
          <Text className="mt-2 text-center text-base text-gray-600">
            By Continuing, You agree to the{' '}
            <Text className="font-medium text-primary-600 underline">
              Terms of Service
            </Text>{' '}
            &{' '}
            <Text className="font-medium text-primary-600 underline">
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
