/* eslint-disable react/no-unstable-nested-components */

import { Stack, useRouter } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, FocusAwareStatusBar, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';
import { useAppLock } from '@/lib/context/app-lock-context';
import { useSecureStorage } from '@/lib/hooks';
import { useStackScreenOptions } from '@/lib/stack-screen-options';
import { theme } from '@/lib/theme-classes';

const WORDS_PER_ROW = 3;

const WordCell = ({ word, position }: { word: string; position: number }) => (
  <View className="mx-1 flex-1 rounded-lg border border-neutral-300 px-3 pb-3 pt-4 dark:border-charcoal-700">
    <Text className={`absolute right-2 top-1 text-xs ${theme.textMuted}`}>{position}</Text>
    <Text testID={`recovery-phrase-word-${position}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} className={`text-base font-semibold ${theme.textPrimary}`}>
      {word}
    </Text>
  </View>
);

const WordGrid = ({ words }: { words: string[] }) => {
  const rows = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < words.length; i += WORDS_PER_ROW) {
      result.push(words.slice(i, i + WORDS_PER_ROW));
    }
    return result;
  }, [words]);

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="my-1 flex-row">
          {row.map((word, columnIndex) => {
            const position = rowIndex * WORDS_PER_ROW + columnIndex + 1;
            return <WordCell key={position} word={word} position={position} />;
          })}
        </View>
      ))}
    </View>
  );
};

export default function SeedPhraseScreen() {
  const { isSeedPhraseBackup } = useContext(AppContext);
  const { getItem: getSeedPhrase } = useSecureStorage('seedPhrase');
  const { authorizeSensitiveAction } = useAppLock();
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();

  useEffect(() => {
    let isActive = true;
    const loadSeedPhrase = async () => {
      // Sensitive Action: the Recovery Phrase is not even read until the user is authenticated
      if (!(await authorizeSensitiveAction('recoveryPhrase'))) {
        if (isActive) router.back();
        return;
      }
      const phrase = await getSeedPhrase();
      if (isActive) setSeedPhrase(phrase);
    };
    loadSeedPhrase();
    return () => {
      isActive = false;
      setSeedPhrase(null);
    };
  }, [authorizeSensitiveAction, getSeedPhrase, router]);

  const words = useMemo(() => (seedPhrase ? seedPhrase.split(' ') : []), [seedPhrase]);

  const continueToVerifyScreen = () => router.push('/settings/backup-seed-phrase/verify');

  const handleCancel = () => {
    router.dismissAll();
    router.replace('/');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView testID="recovery-phrase-screen" className={`flex-1 ${theme.screen}`}>
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t('seedPhraseScreen.header')} />,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
            ...stackScreenOptions,
          }}
        />
        <FocusAwareStatusBar />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <WordGrid words={words} />
          <View className="mt-12">
            <Text testID="recovery-phrase-description" className={`text-center text-base leading-7 ${theme.textPrimary}`}>
              {t('seedPhraseScreen.description')}
            </Text>
            <Text className={`mt-6 text-center text-base leading-7 ${theme.textPrimary}`}>{isSeedPhraseBackup ? t('seedPhraseScreen.notes') : `${t('seedPhraseScreen.notes')} ${t('seedPhraseScreen.verifyNotice')}`}</Text>
          </View>
        </ScrollView>
        {/* Once backed up, the phrase can still be viewed (back arrow) but not verified again */}
        {!isSeedPhraseBackup && (
          <View className="px-6 pb-4">
            <Button testID="saved-button" label={t('seedPhraseScreen.writtenDown')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={continueToVerifyScreen} />
            <Button testID="recovery-phrase-cancel-button" label={t('seedPhraseScreen.cancel')} fullWidth variant="link" textClassName={`text-base font-medium ${theme.textMuted}`} onPress={handleCancel} />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});
