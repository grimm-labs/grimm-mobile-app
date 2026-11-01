import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { colors, Text, View } from '@/components/ui';
import { APP_LOCK_CARD_DISMISSED_KEY, shouldShowAppLockCard } from '@/lib/app-lock';
import { AppContext } from '@/lib/context/app-context-provider';
import { useAppLock } from '@/lib/context/app-lock-context';
import { getItem, setItem } from '@/lib/storage';
import { theme } from '@/lib/theme-classes';

/** Home card inviting the user to turn App Lock on, once the Recovery Phrase is backed up. Closing it hides it for good. */
export const AppLockNotification: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isSeedPhraseBackup } = useContext(AppContext);
  const { isAppLockLoaded, isAppLockEnabled } = useAppLock();
  const [isCardDismissed, setIsCardDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    getItem<boolean>(APP_LOCK_CARD_DISMISSED_KEY).then((dismissed) => setIsCardDismissed(dismissed === true));
  }, []);

  if (!isAppLockLoaded || isCardDismissed === null || !shouldShowAppLockCard({ isAppLockEnabled, isCardDismissed, isRecoveryPhraseBackedUp: isSeedPhraseBackup })) {
    return null;
  }

  const dismiss = async () => {
    setIsCardDismissed(true);
    await setItem(APP_LOCK_CARD_DISMISSED_KEY, true);
  };

  return (
    <Pressable testID="home-app-lock-card" onPress={() => router.push('/settings/app-lock')} className="mb-4 rounded-xl bg-yellow-50 p-4 dark:bg-yellow-900/30">
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className={`mb-1 text-sm font-semibold ${theme.textPrimary}`}>{t('appLock.homeCard.title')}</Text>
          <Text className={`mb-3 text-xs leading-4 ${theme.textSecondary}`}>{t('appLock.homeCard.description')}</Text>
          <View className="flex-row items-center self-start rounded-lg bg-yellow-400 px-4 py-2.5">
            <Ionicons name="lock-closed" size={16} color="white" />
            <Text className="ml-2 text-xs font-semibold text-white">{t('appLock.homeCard.cta')}</Text>
          </View>
        </View>
        <Pressable testID="home-app-lock-card-close" onPress={dismiss} accessibilityLabel={t('appLock.homeCard.close')} hitSlop={8} className="ml-2">
          <Ionicons name="close" size={20} color={colors.neutral[500]} />
        </Pressable>
      </View>
    </Pressable>
  );
};
