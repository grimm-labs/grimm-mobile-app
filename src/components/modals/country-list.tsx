/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import countries from '@/assets/data/countries.json';
import { Button, colors, Image, TouchableOpacity } from '@/ui';

type Props = {
  onClose: () => void;
};

export const CountryListModal = ({ onClose }: Props) => {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    undefined
  );
  const data = Object.values(countries);

  const onCountrySelected = ({ item }: any) => {
    setSelectedCountry(item.name.common);
  };

  const onCloseHandler = ({ _item }: any) => {
    onClose();
  };

  const renderItem = (data: any) => {
    return (
      <TouchableOpacity
        className="mb-4 flex flex-row items-center border-b border-gray-200 pb-2 "
        onPress={() => onCountrySelected(data)}
      >
        <View className="flex-1 flex-row items-center">
          <Image
            style={{ width: 35, height: 25 }}
            className="rounded"
            contentFit="fill"
            source={{ uri: data.item.flag }}
          />
          <View className="ml-2 flex flex-col">
            <Text className="text-base font-bold text-gray-600">
              {data.item.name.common}
            </Text>
            <Text className="text-sm text-gray-500">
              +{data.item.callingCode[0]}
            </Text>
          </View>
        </View>
        {data.item.name.common === selectedCountry && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.success[600]}
            onPress={onClose}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex flex-row items-center border-b border-gray-200 px-3 py-1">
        <Ionicons name="close" size={24} color="gray" onPress={onClose} />
        <View className="flex-1">
          <Text className="text-center text-base font-bold text-gray-600">
            Select your country
          </Text>
        </View>
        <View className="flex">
          <Button
            testID="login-button"
            label="Save"
            fullWidth={false}
            size="sm"
            variant="secondary"
            textClassName="text-sm text-white"
            onPress={onCloseHandler}
            disabled={!selectedCountry}
          />
        </View>
      </View>
      <View className="m-4 flex-1">
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.name.common}
        />
      </View>
    </View>
  );
};
