import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView } from 'react-native';

import { FocusAwareStatusBar, Pressable, Text, View } from '@/ui';

interface ItemProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const Item: React.FC<ItemProps> = ({ title, icon, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row justify-between">
      <View className="flex h-20 w-20 items-center justify-center">
        <Ionicons name={icon} size={24} color="black" />
      </View>
      <View className="h-full flex-1 flex-row items-center justify-between border-b-[0.5px] border-gray-300">
        <View className="h-full flex-1 flex-row items-center">
          <Text className="text-sm font-medium">{title}</Text>
        </View>
        <View className="flex h-20 w-20 items-center justify-center">
          <Ionicons name="chevron-forward" size={24} color="black" />
        </View>
      </View>
    </View>
  </Pressable>
);

export default function NeedHelp() {
  const makeSupportCall = () => {
    Linking.openURL('tel:+2348033333333').catch((err) => console.error('Error making phone call', err));
  };

  return (
    <SafeAreaView>
      <View className="flex h-full pl-4">
        <Stack.Screen
          options={{
            title: 'Help & Support',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="mb-6">
          <Item title="Talk to us" icon="call-outline" onPress={makeSupportCall} />
          <Item
            title="Send us an E-mail"
            icon="mail-outline"
            onPress={() => {
              console.log('submit');
            }}
          />
          <Item
            title="Reach us on Facebook"
            icon="logo-facebook"
            onPress={() => {
              console.log('submit');
            }}
          />
          <Item
            title="Access our Help Center"
            icon="help-circle-outline"
            onPress={() => {
              console.log('submit');
            }}
          />
          <Item
            title="Reach out on X(Formely Twitter)"
            icon="logo-twitter"
            onPress={() => {
              console.log('submit');
            }}
          />
        </View>
        <View className="mx-4">
          <View className="mb-4 border-b-[0.5px] border-gray-300">
            <Text className="my-6 text-sm font-medium">Customer Service Hours(UTC +1:00)</Text>
          </View>
          <View className="mb-4 flex flex-row justify-between">
            <Text className="text-sm font-medium">Mon-Fri</Text>
            <Text>9:00-16:00hrs</Text>
          </View>
          <View className="mb-4 flex flex-row justify-between">
            <Text className="text-sm font-medium">Sunday</Text>
            <Text>9:00-12:00hrs</Text>
          </View>
          <View className="mb-4 flex flex-row justify-between">
            <Text className="text-sm font-medium">Sunday & Public Holidays</Text>
            <Text className="text-sm font-extrabold text-danger-600">Closed</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
