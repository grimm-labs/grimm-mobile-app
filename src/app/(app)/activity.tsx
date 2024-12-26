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
    <SafeAreaView>
      <View className="flex h-full">
        <FocusAwareStatusBar />
        <View className="flex border-b border-neutral-100 px-4 py-3">
          <FocusAwareStatusBar />
          <Text className="text-2xl font-bold text-gray-800">Activity</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex"
        >
          <View className="mt-10">
            <BlankContent
              title="All your transaction will be here"
              subtitle="Get started by making your first deposit"
              icon="pie-chart"
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
