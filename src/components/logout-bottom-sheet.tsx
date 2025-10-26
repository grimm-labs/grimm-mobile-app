import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Modal, Text, useModal } from '@/components/ui';

interface LogoutBottomSheetProps {
  onLogout: () => void;
  hasSeedBackup: boolean;
  onBackupSeed?: () => void;
}

export const LogoutBottomSheet = React.forwardRef<BottomSheetModal, LogoutBottomSheetProps>(({ onLogout, hasSeedBackup, onBackupSeed }, forwardedRef) => {
  const { ref, present, dismiss } = useModal();
  const { t } = useTranslation();

  React.useImperativeHandle(
    forwardedRef,
    () =>
      ({
        present,
        dismiss,
        close: dismiss,
        snapToIndex: () => {},
        snapToPosition: () => {},
        expand: () => {},
        collapse: () => {},
        forceClose: dismiss,
      }) as BottomSheetModal,
  );

  const handleLogout = () => {
    onLogout();
    dismiss();
  };

  const handleBackupFirst = () => {
    dismiss();
    onBackupSeed?.();
  };

  return (
    <Modal ref={ref} snapPoints={[hasSeedBackup ? '30%' : '45%']}>
      <View className="flex-1 px-6 pb-8">
        <View className="flex-1">
          <Text className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t('logoutBottomSheet.title')}</Text>
          <Text className="mb-2 text-base text-gray-600 dark:text-gray-300">{t('logoutBottomSheet.description')}</Text>
          {!hasSeedBackup && (
            <>
              <Text className="mb-2 text-base leading-5 text-gray-600 dark:text-gray-300">{t('logoutBottomSheet.noBackupWarning')}</Text>
              <Text className="text-base font-semibold leading-5 text-red-600 dark:text-red-400">{t('logoutBottomSheet.noBackupDanger')}</Text>
            </>
          )}
        </View>
        <View>
          {!hasSeedBackup && <Button label={t('logoutBottomSheet.backupButton')} fullWidth size="lg" variant="default" textClassName="text-base" onPress={handleBackupFirst} />}
          <Button label={t('logoutBottomSheet.logoutButton')} fullWidth size="lg" variant="destructive" textClassName="text-base" onPress={handleLogout} />
          <Button label={t('logoutBottomSheet.cancelButton')} fullWidth size="lg" variant="outline" textClassName="text-base" onPress={dismiss} />
        </View>
      </View>
    </Modal>
  );
});
