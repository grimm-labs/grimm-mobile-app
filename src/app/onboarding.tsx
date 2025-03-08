import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import { Button, FocusAwareStatusBar } from '@/components/ui';

export default function Onboarding() {
  const router = useRouter();
  return (
    <SafeAreaView>
      <View className="flex h-full justify-between p-4">
        <StatusBar style="dark" />
        <Stack.Screen options={{ headerShown: false }} />
        <FocusAwareStatusBar />
        <View className="flex-1 items-center justify-end pb-6">
          <Text className="mt-5 text-center text-3xl">Welcome to Grimm App</Text>
          <Text className="mt-4 text-center text-gray-600">Safely store, send, receive, and exchange your tokens effortlessly, all in one place.</Text>
        </View>
        <View className="">
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
          <Text className="mt-4 text-center text-gray-600">
            By Continuing, You agree to the <Text className="text-primary-600 underline">Terms of Service</Text> & <Text className="text-primary-600 underline">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
