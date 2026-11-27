/* eslint-disable react/no-unstable-nested-components */
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderTitle } from '@/components/header-title';
import { Button, FocusAwareStatusBar, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

const PLACEHOLDER_ROWS = 4;
const PLACEHOLDER_COLUMNS = 3;

/** The 12 words, hidden: shows what the next screen holds without revealing anything. */
const RecoveryPhrasePlaceholder = () => (
  <View testID="recovery-warning-placeholder" className="items-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {Array.from({ length: PLACEHOLDER_ROWS }, (_, row) => (
      <View key={row} className="my-3 flex-row">
        {Array.from({ length: PLACEHOLDER_COLUMNS }, (__, column) => (
          <View key={column} className="mx-3 h-3 w-20 rounded-full bg-gray-900 dark:bg-charcoal-100" />
        ))}
      </View>
    ))}
  </View>
);

export default function MnemonicWarning() {
  const router = useRouter();
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();

  const handleCancel = () => {
    router.dismissAll();
    router.replace('/');
  };
  const handleProceed = () => router.push('/settings/backup-seed-phrase/recovery-seed-phrase');

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="recovery-warning-screen" className={`flex-1 ${theme.screen}`}>
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('mnemonicWarning.header')} />,
            headerShown: true,
            headerShadowVisible: false,
            // "Cancel, I'll do this later" is the way out of this screen
            headerBackVisible: false,
            headerLeft: () => null,
            ...stackScreenOptions,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text testID="recovery-warning-intro" className={`text-center text-lg leading-7 ${theme.textPrimary}`}>
            {t('mnemonicWarning.intro')}
          </Text>
          <RecoveryPhrasePlaceholder />
          <Text testID="recovery-warning-important" className={`text-center text-base leading-7 ${theme.textPrimary}`}>
            <Trans
              i18nKey="mnemonicWarning.important"
              components={{
                label: <Text className={`text-base font-bold underline ${theme.textPrimary}`} />,
                underline: <Text className={`text-base underline ${theme.textPrimary}`} />,
              }}
            />
          </Text>
        </ScrollView>
        <View className="px-6 pb-4">
          <Button testID="proceed-button" label={t('mnemonicWarning.proceed')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleProceed} />
          <Button testID="cancel-button" label={t('mnemonicWarning.cancel')} fullWidth variant="link" textClassName={`text-base font-medium ${theme.textMuted}`} onPress={handleCancel} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
});
