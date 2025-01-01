/* eslint-disable max-lines-per-function */
import Slider from '@react-native-community/slider'; // Installez-le : npm install @react-native-community/slider
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

export default function TransactionVerificationScreen() {
  const [sliderValue, setSliderValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransactionSend = () => {
    setIsLoading(true);

    // Simule une requête de transaction
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Transaction sent successfully!');
      setSliderValue(0); // Réinitialiser le slider
    }, 3000); // Simule un délai de 3 secondes
  };

  const highlightAddress = (content: string) => {
    if (!content || content.length <= 8) {
      return (
        <Text className="text-base font-bold text-gray-800">{content}</Text>
      );
    }

    const firstPart = content.slice(0, 4); // Les 4 premiers caractères
    const middleText = content.slice(4, -4); // Le texte du milieu
    const lastPart = content.slice(-4); // Les 4 derniers caractères

    return (
      <Text>
        <Text className="font-extrabold">{firstPart}</Text>
        <Text ellipsizeMode="middle">{middleText}</Text>
        <Text className="font-extrabold">{lastPart}</Text>
      </Text>
    );
  };

  return (
    <SafeAreaView className="flex h-full bg-white">
      <View className="h-full flex-1 px-4">
        <Stack.Screen
          options={{
            title: 'Send Bitcoin',
            headerShown: true,
            headerShadowVisible: false,
          }}
        />
        {/* Détails de la transaction */}
        <View className="my-6">
          <View className="mb-4">
            <Text className="mb-2 text-lg font-extrabold">Destination</Text>
            <View className="rounded-lg bg-gray-200 px-3 py-5">
              {highlightAddress(
                '1Lbcfr7sAHTD9CHTD9CgdQo3HTMTkV8gdQo3HTMTkV8LK4ZnX71'
              )}
            </View>
          </View>
          <View className="mb-4">
            <Text className="mb-2 font-extrabold">From</Text>
            <View className="flex flex-row items-center rounded-lg bg-gray-200 p-3">
              <View className="mr-4 rounded bg-primary-500 ">
                <Text className="p-2 font-extrabold text-white">BTC</Text>
              </View>
              <View>
                <Text className="text-base font-bold text-gray-800">
                  $2,000.50
                </Text>
                <Text className="text-sm font-medium text-gray-800">
                  1,400,294 SAT
                </Text>
              </View>
            </View>
          </View>
          <View className="mb-4">
            <Text className="mb-2 font-extrabold">Amount</Text>
            <View className="rounded-lg bg-gray-200 p-3">
              <Text className="text-base font-bold text-gray-800">
                $2000.50
              </Text>
              <Text className="text-sm font-medium text-gray-800">
                1400 SAT
              </Text>
            </View>
          </View>
          <View>
            <Text className="mb-2 font-extrabold">Fee</Text>
            <View className="rounded-lg bg-gray-200 p-3">
              <Text className="text-base font-bold text-gray-800">$0.50</Text>
              <Text className="text-sm font-medium text-gray-800">
                1400 SAT
              </Text>
            </View>
          </View>
        </View>

        {/* Slider pour envoyer */}
        <View className="flex-1 justify-end">
          {isLoading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <View>
              <Text className="mb-2 text-center text-sm text-gray-500">
                Slide to send transaction
              </Text>
              <View className="flex h-[60px] justify-center rounded-full bg-gray-500">
                <Slider
                  style={{ width: '100%', height: '60px' }}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.0001}
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  minimumTrackTintColor="red"
                  maximumTrackTintColor="yellow"
                  thumbTintColor="green"
                  onResponderRelease={(event) => {
                    console.log('release: ', event);
                  }}
                  onSlidingComplete={(value) => {
                    if (value === 1) handleTransactionSend();
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
