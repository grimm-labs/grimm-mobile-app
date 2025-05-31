import * as React from 'react';

import { FocusAwareStatusBar, SafeAreaView, ScrollView, Text, View } from '@/components/ui';

export default function Transactions() {
  return (
    <>
      <FocusAwareStatusBar style="dark" />
      <ScrollView>
        <SafeAreaView className="flex-1">
          <View className="flex border-b border-neutral-100 px-4 py-3">
            <Text className="text-2xl font-bold text-gray-800">Transactions</Text>
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
