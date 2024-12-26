/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';

import { showSuccessMessage } from '@/ui';

type Props = {
  onClose: () => void;
};

export const ReceiveBitcoinModal = ({ onClose }: Props) => {
  const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const copyAdress = () => {
    showSuccessMessage('Bitcoin address copied!');
  };

  return (
    <View className="flex-1 bg-white p-5">
      <View className="flex flex-row items-center justify-between">
        <Ionicons name="close" size={24} color="gray" onPress={onClose} />
        <View className="flex flex-row items-center rounded-xl bg-primary-500 p-2">
          <Text className="font-medium text-white">Done</Text>
          <Ionicons
            name="checkmark"
            size={20}
            color="white"
            onPress={onClose}
          />
        </View>
      </View>
      {/* QR Code */}
      <View className="my-4 flex">
        <Text className="mb-4 text-center text-xl font-medium text-neutral-500">
          Receive Bitcoin
        </Text>
        <Text className="text-center text-base font-medium text-neutral-500">
          Scan the QR code to send funds to this address
        </Text>
      </View>
      <View className="my-8 items-center">
        <QRCodeStyled
          data={address}
          options={{
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: 10,
            width: 450,
            height: 450,
            pieceCornerType: 'cut',
          }}
        />
      </View>

      {/* Address Display */}
      <View className="mx-2 my-8 rounded-lg bg-gray-100 p-4">
        <Text
          className="text-center text-base font-medium text-gray-700"
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {address}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="mb-8 flex flex-row justify-center">
        <View className="mr-4 flex items-center">
          <TouchableHighlight
            onPress={copyAdress}
            className="mb-2 rounded-full bg-neutral-200 p-5"
          >
            <Ionicons name="copy" size={20} className="" />
          </TouchableHighlight>
          <Text className="text-center text-base font-semibold text-gray-600">
            Copy
          </Text>
        </View>
        <View className="ml-4 flex items-center">
          <View className="mb-2 rounded-full bg-neutral-200 p-5">
            <Ionicons name="share" size={20} className="" />
          </View>
          <Text className="text-center text-base font-semibold text-gray-600">
            Share
          </Text>
        </View>
      </View>

      {/* Warning Message */}
      <View className="mx-2 flex-row items-center rounded-xl bg-orange-100 p-4">
        <Text className="text-sm text-orange-800">
          Please check the address before completing the transaction. on-chain
          transactions may take several minutes to be confirmed.
        </Text>
      </View>
    </View>
  );
};
