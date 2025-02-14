/* eslint-disable max-lines-per-function */
/* eslint-disable prettier/prettier */
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/ui/text';

export type NumericVirtualKeyboardProps = {
  onPress?: (value: number) => void;
  allowDotKey?: boolean;
};

export const NumericVirtualKeyboard = ({
  onPress = () => {
    console.log('submit');
  },
  allowDotKey,
}: NumericVirtualKeyboardProps) => {
  return (
    <View className="flex-1 justify-between px-2">
        <View className="mb-2 flex-row justify-around">
          {[1, 2, 3].map((num, index) => (
            <View key={index}>
              <TouchableOpacity
                key={num}
                className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
                onPress={() => onPress(num)}
              >
                <Text className="text-2xl font-medium text-gray-900">{num}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View className="mb-2 flex-row justify-around">
          {[4, 5, 6].map((num, index) => (
            <View key={index}>
              <TouchableOpacity
                key={num}
                className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
                onPress={() => onPress(num)}
              >
                <Text className="text-2xl font-medium text-gray-900">{num}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View className="mb-2 flex-row justify-around">
          {[7, 8, 9].map((num, index) => (
            <View key={index}>
              <TouchableOpacity
                key={num}
                className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
                onPress={() => onPress(num)}
              >
                <Text className="text-2xl font-medium text-gray-900">{num}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View className="flex-row justify-around">
          <View>
            <TouchableOpacity
              key={'EMPTY'}
              className={`m-1 flex h-20 w-20 items-center justify-center rounded-full ${allowDotKey ? 'bg-gray-200' : ''}`}
              onPress={allowDotKey ? () => onPress(-2): () => {}}
            >
            { allowDotKey && (
              <Text className="text-3xl font-bold text-gray-900">•</Text>
            ) }
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              key={'0'}
              className="m-1 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"
              onPress={() => onPress(0)}
            >
              <Text className="text-2xl font-medium text-gray-900">0</Text>
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
              <FontAwesome6 name="delete-left" size={24} color="white" />
            </TouchableOpacity>
          </View>
      </View>
    </View>
  );
};
