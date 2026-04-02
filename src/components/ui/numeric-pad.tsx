import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native-gesture-handler';

import { Text, View } from '@/components/ui';

const Key = ({ value, onPress }: { value: string; onPress: () => void }) => (
  <Pressable onPress={onPress} className="h-16 w-[30%] items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200">
    <Text className="text-2xl font-medium text-gray-800">{value}</Text>
  </Pressable>
);

export const NumericKeypad = ({ amount, setAmount, isBtcUnit }: { amount: string; setAmount: (v: string) => void; isBtcUnit: boolean }) => {
  const handleNumberPress = (num: string) => {
    if (amount === '0' && num !== '.') setAmount(num);
    else if (num === '.' && isBtcUnit && !amount.includes('.')) setAmount(amount + num);
    else if (num !== '.') setAmount(amount + num);
  };

  const handleDelete = () => {
    if (amount.length === 1) setAmount('0');
    else setAmount(amount.slice(0, -1));
  };

  return (
    <View className="mb-4">
      {[
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        [isBtcUnit ? '.' : '', '0', 'del'],
      ].map((row, rowIndex) => (
        <View key={rowIndex} className="mb-3 flex-row justify-between">
          {row.map((val, idx) =>
            val === '' ? (
              <View key={idx} className="h-16 w-[30%]" />
            ) : val === 'del' ? (
              <Pressable key={idx} testID="delete-key" onPress={handleDelete} className="h-16 w-[30%] items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200">
                <MaterialCommunityIcons name="backspace-outline" size={28} color="#374151" />
              </Pressable>
            ) : (
              <Key key={idx} value={val} onPress={() => handleNumberPress(val)} />
            ),
          )}
        </View>
      ))}
    </View>
  );
};
