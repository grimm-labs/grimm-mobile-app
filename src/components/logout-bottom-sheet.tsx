import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, View } from 'react-native';

import { Button, Modal, Text, useModal } from '@/components/ui';
import { theme } from '@/lib/theme-classes';
import { useModalBottomInset } from '@/lib/use-modal-bottom-inset';

interface LogoutBottomSheetProps {
  onLogout: () => void;
  hasSeedBackup: boolean;
  onBackupSeed?: () => void;
}

const MAX_MODAL_HEIGHT = Dimensions.get('window').height * 0.85;

export const LogoutBottomSheet = React.forwardRef<BottomSheetModal, LogoutBottomSheetProps>(({ onLogout, hasSeedBackup, onBackupSeed }, forwardedRef) => {
  const { ref, present, dismiss } = useModal();
  const { t } = useTranslation();
  const bottomInset = useModalBottomInset();

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
    <Modal ref={ref} enableDynamicSizing maxDynamicContentSize={MAX_MODAL_HEIGHT} showCloseButton={false} bottomInset={bottomInset}>
      <BottomSheetView>
        <View className="px-6 pb-4">
          <View className="mb-4">
            <Text className={`mb-2 text-2xl font-bold ${theme.textPrimary}`}>{t('logoutBottomSheet.title')}</Text>
            <Text className={`mb-2 text-base ${theme.textSecondary}`}>{t('logoutBottomSheet.description')}</Text>
            {!hasSeedBackup && (
              <>
                <Text className={`mb-2 text-base leading-5 ${theme.textSecondary}`}>{t('logoutBottomSheet.noBackupWarning')}</Text>
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
      </BottomSheetView>
    </Modal>
  );
});
