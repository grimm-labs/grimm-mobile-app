import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button, colors, Image, SafeAreaView, Text, View } from '@/components/ui';
import { formatBalance } from '@/lib';
import { AppContext } from '@/lib/context';
import { useStackScreenOptions } from '@/lib/stack-screen-options';

type SearchParams = {
  transactionType: 'sent' | 'received';
  satsAmount: string;
};

// A Lightning payment or Withdrawal the SDK still reports as Pending after its timeout: it may still complete
export default function PendingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { transactionType, satsAmount } = useLocalSearchParams<SearchParams>();
  const { bitcoinUnit } = useContext(AppContext);
  const stackScreenOptions = useStackScreenOptions();

  // Back to Home with an empty stack, so Back never returns to the payment
  const goHome = () => {
    router.dismissAll();
    router.replace('/');
  };

  // The hardware back button goes home too: the payment screen behind still has its slider, and the payment is in flight
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.dismissAll();
      router.replace('/');
      return true;
    });
    return () => subscription.remove();
  }, [router]);

  const headerLeft = () => (
    <TouchableOpacity onPress={goHome}>
      <Ionicons name="close-sharp" size={32} color={colors.primary[600]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="transaction-pending-screen" className="flex-1 bg-white dark:bg-charcoal-950">
        <Stack.Screen options={{ headerTitle: '', headerShown: true, headerShadowVisible: false, headerLeft, gestureEnabled: false, ...stackScreenOptions }} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-8 size-24 items-center justify-center rounded-full bg-primary-100">
            <Ionicons name="time-outline" size={56} color={colors.primary[600]} />
          </View>

          <Text testID="transaction-pending-title" className="mb-8 text-center text-2xl text-gray-900 dark:text-charcoal-100">
            {transactionType === 'received' ? t('transaction.pending.receivedTitle') : t('transaction.pending.sentTitle')}
          </Text>

          <View className="mb-6 flex-row items-center">
            <View className="mr-3 size-8 items-center justify-center rounded-full bg-orange-500">
              <Image className="mr-2 size-8 rounded-full" source={require('@/assets/images/bitcoin_logo.png')} />
            </View>
            <Text testID="transaction-pending-amount" className="text-4xl font-semibold text-neutral-700 dark:text-charcoal-100">
              {formatBalance(Number(satsAmount), bitcoinUnit)}
            </Text>
          </View>

          <Text className="mb-12 text-center text-base text-gray-500 dark:text-charcoal-400">{t('transaction.pending.note')}</Text>
        </View>

        <View className="mb-4 px-6">
          <Button testID="transaction-pending-ok" label={t('transaction.okButton')} size="lg" fullWidth onPress={goHome} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
