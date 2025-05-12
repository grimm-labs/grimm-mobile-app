import * as React from 'react';

import { FocusAwareStatusBar, SafeAreaView, ScrollView, Text } from '@/components/ui';

export default function Transactions() {
  return (
    <>
      <FocusAwareStatusBar style="dark" />
      <ScrollView className="px-4">
        <SafeAreaView className="flex-1">
          <Text className="text-2xl font-bold">Transactions</Text>
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
