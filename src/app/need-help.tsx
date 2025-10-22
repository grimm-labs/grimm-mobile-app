/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';

interface ItemProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const supportLinks = {
  call: 'tel:+237692279214',
  email: 'mailto:support@usegrimm.app?subject=Support Request',
  facebook: 'https://www.facebook.com/grimmtechnologies',
  twitter: 'https://twitter.com/useGrimmApp',
  linkedIn: 'https://www.linkedin.com/company/grimm-technologies',
};

const Item: React.FC<ItemProps> = ({ title, icon, onPress }) => (
  <Pressable onPress={onPress}>
    <View className="flex flex-row justify-between">
      <View className="flex size-20 items-center justify-center ">
        <Ionicons name={icon} size={28} color="black" />
      </View>
      <View className="h-full flex-1 flex-row items-center justify-between border-b-[0.5px] border-gray-300">
        <View className="h-full flex-1 flex-row items-center">
          <Text className="text-sm font-medium">{title}</Text>
        </View>
        <View className="flex size-20 items-center justify-center">
          <Ionicons name="chevron-forward" size={24} color={colors.primary[600]} />
        </View>
      </View>
    </View>
  </Pressable>
);

const ServiceHours: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View className="mx-2">
      <View className="mb-4 border-b-[0.5px] border-gray-300">
        <Text className="my-6 text-sm font-medium">{t('help.service_hours_title')}</Text>
      </View>
      <View className="mb-4 flex flex-row justify-between">
        <Text className="text-sm font-medium">{t('help.monday_friday')}</Text>
        <Text>{t('help.hours_mon_fri')}</Text>
      </View>
      <View className="mb-4 flex flex-row justify-between">
        <Text className="text-sm font-medium">{t('help.saturday')}</Text>
        <Text>{t('help.hours_saturday')}</Text>
      </View>
      <View className="mb-4 flex flex-row justify-between">
        <Text className="text-sm font-medium">{t('help.sunday_holidays')}</Text>
        <Text className="text-sm font-extrabold text-danger-600">{t('help.closed')}</Text>
      </View>
    </View>
  );
};

const SupportItems: React.FC = () => {
  const { t } = useTranslation();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error(`Error opening link: ${url}`, err));
  };

  return (
    <View className="mb-6">
      <Item title={t('help.talk_us')} icon="call-outline" onPress={() => openLink(supportLinks.call)} />
      <Item title={t('help.send_email')} icon="mail-outline" onPress={() => openLink(supportLinks.email)} />
      <Item title={t('help.facebook')} icon="logo-facebook" onPress={() => openLink(supportLinks.facebook)} />
      <Item title={t('help.linkedin')} icon="logo-linkedin" onPress={() => openLink(supportLinks.linkedIn)} />
      <Item title={t('help.twitter')} icon="logo-twitter" onPress={() => openLink(supportLinks.twitter)} />
    </View>
  );
};

export default function NeedHelp() {
  const { t } = useTranslation();
  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full px-4">
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitleAlign: 'center',
              headerTitle: () => <HeaderTitle title={t('help.header')} />,
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
    </SafeAreaProvider>
  );
}
