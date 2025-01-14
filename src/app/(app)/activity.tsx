import React from 'react';

import { BlankContent } from '@/components/blank-content';
import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/ui';

export default function Activity() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex">
        <View className="flex border-b border-neutral-100 px-4 py-3">
          <FocusAwareStatusBar />
          <Text className="text-2xl font-bold text-gray-800">Activity</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="h-full"
        >
          <View className="h-full flex-1 items-center justify-center pt-8">
            <BlankContent
              title="All your transaction will be here"
              icon="pie-chart"
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
