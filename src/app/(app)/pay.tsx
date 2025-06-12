import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';

import { colors, FocusAwareStatusBar, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from '@/components/ui';

export default function PayBills() {
  return (
    <>
      <FocusAwareStatusBar style="dark" />
      <ScrollView>
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex flex-row items-center justify-between border-b border-neutral-200 px-4">
            <View className="flex  py-3">
              <Text className="text-2xl font-bold text-gray-800">Pay Bills</Text>
            </View>
          </View>

          {/* Select Category Section */}
          <View className="px-4 py-2">
            <Text testID="form-title" className="my-2 text-lg font-normal text-gray-500">
              Use your bitcoin to pay for a good or service and also send money to any person or business
            </Text>

            {/* Send Money Option */}
            <TouchableOpacity className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-100 bg-white p-4">
              <View className="flex-row items-center">
                <View className="mr-3 size-12 items-center justify-center rounded-full bg-green-100">
                  <Text className="p-3 text-lg text-green-600">💸</Text>
                </View>
                <Text className="text-base font-medium text-gray-900">Send Money</Text>
              </View>
              <View className="size-6 items-center justify-center">
                <Ionicons name="chevron-forward" size={24} color={colors.primary[600]} />
              </View>
            </TouchableOpacity>

            {/* Airtime Option */}
            <TouchableOpacity className="mb-3 flex-row items-center justify-between rounded-lg border border-gray-100 bg-white p-4">
              <View className="flex-row items-center">
                <View className="mr-3 size-12 items-center justify-center rounded-full bg-red-100">
                  <Text className="p-3 text-lg text-red-600">📞</Text>
                </View>
                <Text className="text-base font-medium text-gray-900">Airtime</Text>
              </View>
              <View className="size-6 items-center justify-center">
                <Ionicons name="chevron-forward" size={24} color={colors.primary[600]} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
