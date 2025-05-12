import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { colors, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';

interface ItemProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const supportLinks = {
  call: 'tel:+237692279214',
  email: 'mailto:support@usegrimm.app?subject=Support Request',
  facebook: 'https://www.facebook.com/grimm-app',
  helpCenter: 'https://help.usegrimm.app',
  twitter: 'https://twitter.com/useGrimmApp',
  linkedIn: 'https://www.linkedin.com/company/usegrimmapp',
};

const Item: React.FC<ItemProps> = ({ title, icon, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row justify-between">
      <View className="flex size-20 items-center justify-center">
        <Ionicons name={icon} size={24} color="black" />
      </View>
      <View className="h-full flex-1 flex-row items-center justify-between border-b-[0.5px] border-gray-300">
        <View className="h-full flex-1 flex-row items-center">
          <Text className="text-sm font-medium">{title}</Text>
        </View>
        <View className="flex size-20 items-center justify-center">
          <Ionicons name="chevron-forward" size={24} color={colors.success[600]} />
        </View>
      </View>
    </View>
  </Pressable>
);

const ServiceHours = () => (
  <View className="mx-4">
    <View className="mb-4 border-b-[0.5px] border-gray-300">
      <Text className="my-6 text-sm font-medium">Customer Service Hours (UTC +1:00)</Text>
    </View>
    <View className="mb-4 flex flex-row justify-between">
      <Text className="text-sm font-medium">Mon-Fri</Text>
      <Text>9:00-16:00hrs</Text>
    </View>
    <View className="mb-4 flex flex-row justify-between">
      <Text className="text-sm font-medium">Saturday</Text>
      <Text>9:00-12:00hrs</Text>
    </View>
    <View className="mb-4 flex flex-row justify-between">
      <Text className="text-sm font-medium">Sunday & Public Holidays</Text>
      <Text className="text-sm font-extrabold text-danger-600">Closed</Text>
    </View>
  </View>
);

const SupportItems = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error(`Error opening link: ${url}`, err));
  };

  return (
    <View className="mb-6">
      <Item title="Talk to us" icon="call-outline" onPress={() => openLink(supportLinks.call)} />
      <Item title="Send us an E-mail" icon="mail-outline" onPress={() => openLink(supportLinks.email)} />
      <Item title="Reach us on Facebook" icon="logo-facebook" onPress={() => openLink(supportLinks.facebook)} />
      <Item title="Follow us on LinkedIn" icon="logo-linkedin" onPress={() => openLink(supportLinks.linkedIn)} />
      <Item title="Access our Help Center" icon="help-circle-outline" onPress={() => openLink(supportLinks.helpCenter)} />
      <Item title="Reach out on X (Formerly Twitter)" icon="logo-twitter" onPress={() => openLink(supportLinks.twitter)} />
    </View>
  );
};

export default function NeedHelp() {
  return (
    <SafeAreaView>
      <View className="flex h-full pl-4">
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Help & Support',
            headerLeft: HeaderLeft,
            headerRight: () => null,
            headerShadowVisible: false,
          }}
        />
        <FocusAwareStatusBar style="dark" />
        <SupportItems />
        <ServiceHours />
      </View>
    </SafeAreaView>
  );
}
