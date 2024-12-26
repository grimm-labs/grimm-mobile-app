/* eslint-disable max-lines-per-function */
/* eslint-disable prettier/prettier */
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/ui';

export type NumericVirtualKeyboardProps = {
  onPress?: (value: number) => void;
};

export const NumericVirtualKeyboard = ({
  onPress = () => {
    console.log('submit');
  },
}: NumericVirtualKeyboardProps) => {
  return (
    <View className="justify-between px-4 pb-6">
      <View>
        <View className="mb-4 flex-row justify-around">
          {[1, 2, 3].map((num, index) => (
            <View key={index}>
              <TouchableOpacity
                key={num}
                className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
                onPress={() => onPress(num)}
              >
                <Text className="text-lg font-medium text-gray-900">{num}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View className="mb-4 flex-row justify-around">
          {[4, 5, 6].map((num, index) => (
            <View key={index}>
              <TouchableOpacity
                key={num}
                className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
                onPress={() => onPress(num)}
              >
                <Text className="text-lg font-medium text-gray-900">{num}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View className="mb-4 flex-row justify-around">
          {[7, 8, 9].map((num, index) => (
            <View key={index}>
              <TouchableOpacity
                key={num}
                className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
                onPress={() => onPress(num)}
              >
                <Text className="text-lg font-medium text-gray-900">{num}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View className="flex-row justify-around">
          <View>
            <TouchableOpacity
              key={'EMPTY'}
              className="m-1 flex h-20 w-20 items-center justify-center rounded-full"
              onPress={() => { }}
            />
          </View>
          <View>
            <TouchableOpacity
              key={'0'}
              className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
              onPress={() => onPress(0)}
            >
              <Text className="text-lg font-medium text-gray-900">0</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              key={'DELETE'}
              className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-danger-600"
              onPress={() => {
                onPress(-1);
              }}
            >
              <FontAwesome6 name="delete-left" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
