import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';

import { colors, Pressable, Text, View } from '@/components/ui';

const Key = ({ value, onPress }: { value: string; onPress: () => void }) => (
  <Pressable onPress={onPress} className="flex h-16 w-[30%] items-center justify-center rounded-2xl bg-gray-200">
    <Text className="text-3xl font-medium text-gray-800">{value}</Text>
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
        ['.', '0', 'del'],
      ].map((row, rowIndex) => (
        <View key={rowIndex} className="mb-3 flex-row justify-between">
          {row.map((val, idx) =>
            val === 'del' ? (
              <Pressable key={idx} testID="delete-key" onPress={handleDelete} className="flex h-16 w-[30%] items-center justify-center rounded-2xl bg-gray-200">
                <Ionicons name="backspace" size={28} color={colors.black} />
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
