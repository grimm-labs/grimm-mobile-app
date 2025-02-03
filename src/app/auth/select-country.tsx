import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList } from 'react-native';

import countries from '@/assets/data/countries.json';
import type { CountryItem } from '@/core';
import { CountryManager } from '@/core';
import { useSelectedCountry } from '@/core/hooks/use-selected-country';
import { useSoftKeyboardEffect } from '@/core/keyboard';
import {
  colors,
  FocusAwareStatusBar,
  Image,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';

interface RenderItemData {
  index: number;
  item: CountryItem;
}

export default function SelectCountry() {
  const [selectedCountry, setSelectedCountry] = useSelectedCountry();
  const router = useRouter();
  useSoftKeyboardEffect();

  const countryManager = new CountryManager(countries);

  const renderItem = ({ item }: RenderItemData) => {
    return (
      <TouchableOpacity
        className="mb-4 flex flex-row items-center border-b border-gray-200 pb-2 "
        onPress={() => {
          setSelectedCountry(item.code);
          router.back();
        }}
      >
        <View className="flex-1 flex-row items-center">
          <Image
            style={{ width: 35, height: 28 }}
            className="rounded"
            contentFit="fill"
            source={{ uri: item.flag }}
          />
          <View className="ml-2 flex flex-col">
            <Text className="text-lg font-medium text-gray-700">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500">+{item.callingCode}</Text>
          </View>
        </View>
        {item.code === selectedCountry && (
          <Ionicons
            name="checkmark-circle"
            size={26}
            color={colors.success[600]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Select country',
          headerShown: true,
          headerShadowVisible: false,
        }}
      />
      <FocusAwareStatusBar />
      <View className="flex-1 bg-white">
        <View className="mx-4 flex-1">
          <FlatList
            data={countryManager.getAllCountries()}
            renderItem={renderItem}
            keyExtractor={(item) => item.code}
          />
        </View>
      </View>
    </>
  );
}
