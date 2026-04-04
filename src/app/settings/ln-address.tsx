/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, Input, Modal, Pressable, SafeAreaView, ScrollView, Text, useModal, View } from '@/components/ui';
import { GRIMM_APP_LN_URL_DOMAIN } from '@/lib/constant';
import { useBreez } from '@/lib/context/breez-context';
import { generateRandomUsername, LN_USERNAME_MIN_LENGTH, validateLnUsername } from '@/lib/utils';

type ScreenMode = 'view' | 'create' | 'edit';

export default function LnAddressScreen() {
  const { t } = useTranslation();
  const { lightningAddress, checkLightningAddressAvailable, registerLightningAddress, deleteLightningAddress } = useBreez();

  const [mode, setMode] = useState<ScreenMode>('view');
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmModal = useModal();
  const deleteModal = useModal();

  const fullAddress = useMemo(() => (username ? `${username}@${GRIMM_APP_LN_URL_DOMAIN}` : ''), [username]);

  const existingUsername = useMemo(() => {
    if (!lightningAddress) return '';
    const atIndex = lightningAddress.indexOf('@');
    return atIndex > 0 ? lightningAddress.substring(0, atIndex) : lightningAddress;
  }, [lightningAddress]);

  const headerTitle = useMemo(() => {
    if (mode === 'create') return t('lnAddressSettings.create.headerTitle');
    if (mode === 'edit') return t('lnAddressSettings.edit.headerTitle');
    return t('lnAddressSettings.headerTitle');
  }, [mode, t]);

  const resetForm = useCallback(() => {
    setUsername('');
    setValidationError(null);
    setIsLoading(false);
    setIsSubmitting(false);
  }, []);

  const handleUsernameChange = useCallback(
    (text: string) => {
      const lowered = text.toLowerCase().trim();
      setUsername(lowered);
      if (lowered.length > 0) {
        setValidationError(validateLnUsername(lowered, t));
      } else {
        setValidationError(null);
      }
    },
    [t],
  );

  const handleGenerateRandom = useCallback(() => {
    const name = generateRandomUsername();
    setUsername(name);
    setValidationError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const error = validateLnUsername(username, t);
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      setIsLoading(true);
      const available = await checkLightningAddressAvailable(username);
      if (!available) {
        setValidationError(t('lnAddressSettings.create.taken'));
        return;
      }
      confirmModal.present();
    } catch {
      showMessage({ message: t('lnAddressSettings.errors.checkFailed'), type: 'danger', duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  }, [username, checkLightningAddressAvailable, confirmModal, t]);

  const handleConfirmCreate = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await registerLightningAddress(username);
      confirmModal.dismiss();
      resetForm();
      setMode('view');
      showMessage({ message: mode === 'edit' ? t('lnAddressSettings.success.updated') : t('lnAddressSettings.success.created'), type: 'success', duration: 2000 });
    } catch {
      confirmModal.dismiss();
      showMessage({ message: t('lnAddressSettings.errors.createFailed'), type: 'danger', duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [username, registerLightningAddress, confirmModal, resetForm, mode, t]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await deleteLightningAddress();
      deleteModal.dismiss();
      resetForm();
      setMode('view');
      showMessage({ message: t('lnAddressSettings.success.deleted'), type: 'success', duration: 2000 });
    } catch {
      deleteModal.dismiss();
      showMessage({ message: t('lnAddressSettings.errors.deleteFailed'), type: 'danger', duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteLightningAddress, deleteModal, resetForm, t]);

  const handleCopyAddress = useCallback(async () => {
    if (lightningAddress) {
      await Clipboard.setStringAsync(lightningAddress);
      showMessage({ message: t('lnAddressSettings.copiedToClipboard'), type: 'success', duration: 2000 });
    }
  }, [lightningAddress, t]);

  const handleStartCreate = useCallback(() => {
    resetForm();
    setMode('create');
  }, [resetForm]);

  const handleStartEdit = useCallback(() => {
    resetForm();
    setUsername(existingUsername);
    setMode('edit');
  }, [resetForm, existingUsername]);

  const handleBack = useCallback(() => {
    resetForm();
    setMode('view');
  }, [resetForm]);

  const canSubmit = username.length >= LN_USERNAME_MIN_LENGTH && !validationError && !isLoading;

  const renderEmptyState = () => (
    <View className="flex-1 px-4">
      <View className="flex-1 items-center justify-center">
        <View className="mb-6 rounded-full bg-primary-600 p-6">
          <Ionicons name="at" size={48} color={colors.white} />
        </View>
        <Text className="mb-3 text-center text-xl font-medium text-gray-800">{t('lnAddressSettings.emptyState.title')}</Text>
        <Text className="text-small text-center text-gray-500">{t('lnAddressSettings.emptyState.subtitle')}</Text>
      </View>
      <View className="pb-4">
        <Button label={t('lnAddressSettings.emptyState.cta')} variant="secondary" textClassName="text-base text-white" size="lg" fullWidth onPress={handleStartCreate} />
      </View>
    </View>
  );

  const renderAddressView = () => (
    <View className="flex-1 px-4 pt-6">
      <View className="mb-6 rounded-xl border border-neutral-200 bg-neutral-100 p-4">
        <Text className="mb-1 text-sm text-gray-500">{t('lnAddressSettings.currentAddress')}</Text>
        <Pressable onPress={handleCopyAddress} className="flex-row items-center justify-between">
          <Text className="text-lg font-medium text-gray-800">{lightningAddress}</Text>
          <Ionicons name="copy-outline" size={20} color={colors.neutral[500]} />
        </Pressable>
      </View>

      <Pressable onPress={handleStartEdit} className="mb-3 flex-row items-center justify-center py-2">
        <Ionicons name="create-outline" size={18} color={colors.primary[600]} />
        <Text className="ml-2 text-sm font-medium text-primary-600">{t('lnAddressSettings.edit.headerTitle')}</Text>
      </Pressable>

      <Button label={t('lnAddressSettings.delete.button')} variant="destructive" size="lg" textClassName="text-white text-base" fullWidth onPress={() => deleteModal.present()} />
    </View>
  );

  const renderForm = () => (
    <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
      {/* Username input with domain preview */}
      <View className="mb-2">
        <Input
          placeholder={t('lnAddressSettings.create.usernamePlaceholder')}
          value={username}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
          autoCorrect={false}
          error={validationError ?? undefined}
          suffix={<Text className="text-base font-medium text-gray-500">@{GRIMM_APP_LN_URL_DOMAIN}</Text>}
        />
      </View>

      {/* Generate random name button */}
      <Pressable onPress={handleGenerateRandom} className="mb-3 flex-row items-center justify-center py-2">
        <Ionicons name="shuffle" size={18} color={colors.primary[600]} />
        <Text className="ml-2 text-sm font-medium text-primary-600">{t('lnAddressSettings.create.generateRandom')}</Text>
      </Pressable>

      {/* Submit button */}
      <Button
        label={mode === 'edit' ? t('lnAddressSettings.edit.save') : t('lnAddressSettings.confirm.confirmButton')}
        variant="secondary"
        textClassName="text-base text-white"
        size="lg"
        fullWidth
        disabled={!canSubmit}
        loading={isLoading}
        onPress={handleSubmit}
      />
    </ScrollView>
  );

  const renderContent = () => {
    if (mode === 'create' || mode === 'edit') return renderForm();
    if (lightningAddress) return renderAddressView();
    return renderEmptyState();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex h-full">
          <Stack.Screen
            options={{
              headerTitle: () => <HeaderTitle title={headerTitle} />,
              headerTitleAlign: 'center',
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: () =>
                mode === 'view' ? (
                  <HeaderLeft />
                ) : (
                  <Pressable onPress={handleBack} className="mr-4">
                    <Ionicons name="arrow-back-outline" size={24} color={colors.primary[600]} />
                  </Pressable>
                ),
            }}
          />
          <FocusAwareStatusBar style="dark" />
          {renderContent()}
        </View>

        {/* Confirmation Modal - Create/Edit */}
        <Modal ref={confirmModal.ref} snapPoints={['35%']} showCloseButton={false}>
          <View className="flex-1 px-6 pb-8">
            <Text className="mb-2 text-2xl font-bold text-gray-900">{t('lnAddressSettings.confirm.title')}</Text>
            <Text className="mb-2 text-base text-gray-600">{t('lnAddressSettings.confirm.message')}</Text>
            <Text className="mb-6 text-lg font-bold text-primary-600">{fullAddress}</Text>
            <View>
              <Button label={t('lnAddressSettings.confirm.confirmButton')} fullWidth size="lg" variant="secondary" textClassName="text-base text-white" loading={isSubmitting} onPress={handleConfirmCreate} />
              <Button label={t('lnAddressSettings.confirm.cancelButton')} fullWidth size="lg" variant="outline" onPress={confirmModal.dismiss} />
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal ref={deleteModal.ref} snapPoints={['35%']} showCloseButton={false}>
          <View className="flex-1 px-6 pb-8">
            <Text className="mb-2 text-2xl font-bold text-gray-900">{t('lnAddressSettings.delete.title')}</Text>
            <Text className="mb-6 text-base text-gray-600">{t('lnAddressSettings.delete.message')}</Text>
            <View>
              <Button label={t('lnAddressSettings.delete.confirmButton')} fullWidth size="lg" variant="destructive" loading={isSubmitting} onPress={handleConfirmDelete} />
              <Button label={t('lnAddressSettings.delete.cancelButton')} fullWidth size="lg" variant="outline" onPress={deleteModal.dismiss} />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
