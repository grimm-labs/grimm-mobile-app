import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, SafeAreaView, ScrollView, Text, View } from '@/components/ui';

export default function Transactions() {
  return (
    <SafeAreaProvider>
      <FocusAwareStatusBar style="dark" />
      <ScrollView>
        <SafeAreaView className="flex-1">
          <View className="flex border-b border-neutral-100 px-4 py-3">
            <Text className="text-2xl font-bold text-gray-800">Transactions</Text>
          </View>
        </SafeAreaView>
      </ScrollView>
    </SafeAreaProvider>
  );
}
