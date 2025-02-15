/* eslint-disable react-native/no-inline-styles */
import { Stack, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native';

import { Button, FocusAwareStatusBar, Text, View } from '@/ui';

type SearchParams = {
  status?: 'success' | 'failed';
};

export default function TransactionFinalStatus() {
  const { status } = useLocalSearchParams<SearchParams>();

  const animation = useRef<LottieView>(null);

  const handleContinue = () => {
    // Logic to proceed with the entered
  };

  return (
    <SafeAreaView>
      <View className="flex h-full px-4">
        <Stack.Screen
          options={{
            title: 'Send bitcoin',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="flex-1">
          <View className="flex-1 items-center justify-center ">
            <LottieView
              autoPlay
              loop={false}
              ref={animation}
              style={{
                width: 200,
                height: 200,
                backgroundColor: 'transparent',
              }}
              source={status === 'success' ? require('@/assets/lotties/success.json') : require('@/assets/lotties/failed.json')}
            />
            {status === 'failed' ? <Text className="text-xl font-medium">Payment failed</Text> : <Text className="text-xl font-medium">Payment has been sent successfully </Text>}
          </View>

          <View className="">
            <Button testID="login-button" label="Go Home" fullWidth={true} size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
