/* eslint-disable no-secrets/no-secrets */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { DEFAULT_LN_INVOICE_EXPIRY_SECS, LN_INVOICE_EXPIRY_OPTIONS } from '@/lib/constant';
import { AppContext } from '@/lib/context';

interface ExpiryOptionProps {
  title: string;
  description?: string;
  seconds: number;
  isSelected: boolean;
  onSelect: (seconds: number) => void;
}

const ExpiryOption = React.memo<ExpiryOptionProps>(({ title, description, seconds, isSelected, onSelect }) => {
  const handlePress = useCallback(() => onSelect(seconds), [onSelect, seconds]);

  return (
    <Pressable onPress={handlePress} style={{ opacity: 1 }} testID={`ln-invoice-expiry-option-${seconds}`}>
      <View className="flex min-h-[56px] flex-row items-center justify-between border-b-[0.5px] border-gray-300 px-2 py-4">
        <View className="flex-1 pr-4">
          <Text className="text-sm font-medium text-gray-900 dark:text-charcoal-100">{title}</Text>
          {description ? <Text className="mt-1 text-xs leading-4 text-gray-500 dark:text-charcoal-400">{description}</Text> : null}
        </View>
        <View className="size-6 shrink-0 items-center justify-center">{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}</View>
      </View>
    </Pressable>
  );
});

ExpiryOption.displayName = 'ExpiryOption';

export default function LnInvoiceExpiryScreen() {
  const { t } = useTranslation();
  const { lnInvoiceExpirySecs, setLnInvoiceExpirySecs } = useContext(AppContext);

  const handleSelect = useCallback(
    (seconds: number) => {
      setLnInvoiceExpirySecs(seconds);
    },
    [setLnInvoiceExpirySecs],
  );

  const expiryOptions = useMemo(
    () =>
      LN_INVOICE_EXPIRY_OPTIONS.map((option) => ({
        key: option.key,
        seconds: option.seconds,
        title: t(`lnInvoiceExpiry.options.${option.key}`),
        description: option.seconds === DEFAULT_LN_INVOICE_EXPIRY_SECS ? t('lnInvoiceExpiry.default_hint') : undefined,
        isSelected: lnInvoiceExpirySecs === option.seconds,
      })),
    [t, lnInvoiceExpirySecs],
  );

  const screenOptions = useMemo(
    () => ({
      headerTitleAlign: 'center' as const,
      headerTitle: () => <HeaderTitle title={t('lnInvoiceExpiry.header_title')} />,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-charcoal-950">
        <View className="flex h-full px-4">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar />
          <View className="mt-4">
            {expiryOptions.map((option) => (
              <ExpiryOption key={option.key} title={option.title} description={option.description} seconds={option.seconds} isSelected={option.isSelected} onSelect={handleSelect} />
            ))}
          </View>
          <View className="mt-6 px-2">
            <Text className="text-xs leading-5 text-gray-500 dark:text-charcoal-400">{t('lnInvoiceExpiry.info_text')}</Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
