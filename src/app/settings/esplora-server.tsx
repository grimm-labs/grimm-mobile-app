/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
/* eslint-disable react-native/no-inline-styles */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, Pressable, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { useBdk } from '@/lib/context';
import { useBreez } from '@/lib/context/breez-context';

interface ServerOptionProps {
  id: string;
  baseUrl: string;
  isSelected: boolean;
  isActive: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const ServerOption = React.memo<ServerOptionProps>(({ id, baseUrl, isSelected, isActive, onPress, disabled = false }) => {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} style={{ opacity: disabled ? 0.5 : 1 }} disabled={disabled}>
      <View className="flex min-h-[64px] flex-row items-center justify-between border-b-[0.5px] border-gray-300 px-2 py-4">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-gray-900">{id}</Text>
            {isActive && (
              <View className="ml-2 rounded-full bg-success-100 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-success-700">{t('esploraServer.inUse')}</Text>
              </View>
            )}
          </View>
          <Text className="mt-1 text-xs text-gray-500">{baseUrl}</Text>
        </View>
        <View className="size-6 shrink-0 items-center justify-center">
          {isActive ? <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} /> : isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}
        </View>
      </View>
    </Pressable>
  );
});

ServerOption.displayName = 'ServerOption';

export default function EsploraServerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { network } = useBreez();
  const { availableServers, selectedServerId, setSelectedServer, isSyncing, isConnected } = useBdk();

  const [pendingId, setPendingId] = useState<string | null>(selectedServerId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPendingId((prev) => prev ?? selectedServerId);
  }, [selectedServerId]);

  const handleSelect = useCallback((serverId: string) => {
    setPendingId(serverId);
  }, []);

  const handleSave = useCallback(async () => {
    if (!pendingId || pendingId === selectedServerId) {
      return;
    }
    try {
      setIsSaving(true);
      await setSelectedServer(pendingId);
      router.back();
    } catch (error) {
      console.error('Error saving Esplora server:', error);
      showErrorMessage(t('esploraServer.connectionFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [pendingId, selectedServerId, setSelectedServer, router, t]);

  const screenOptions = useMemo(
    () => ({
      headerTitleAlign: 'center' as const,
      headerTitle: () => <HeaderTitle title={t('esploraServer.headerTitle')} />,
      headerShown: true,
      headerShadowVisible: false,
      headerLeft: HeaderLeft,
    }),
    [t],
  );

  const isDisabled = isSaving || isSyncing;
  const canSave = !!pendingId && pendingId !== selectedServerId && !isDisabled;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View className="flex h-full px-4">
          <Stack.Screen options={screenOptions} />
          <FocusAwareStatusBar style="dark" />

          <View className="mb-2 mt-4 px-2">
            <Text className="text-xs text-gray-600">{t('esploraServer.currentNetwork', { network })}</Text>
          </View>

          <View className="mt-2 flex-1">
            {availableServers.map((server) => (
              <ServerOption
                key={server.id}
                id={server.id}
                baseUrl={server.baseUrl}
                isSelected={pendingId === server.id}
                isActive={isConnected && selectedServerId === server.id}
                onPress={() => handleSelect(server.id)}
                disabled={isDisabled}
              />
            ))}

            <View className="mt-6 px-2">
              <Text className="text-xs leading-5 text-gray-500">{t('esploraServer.info')}</Text>
            </View>
          </View>

          <View className="mb-8 mt-4">
            <Pressable className={`flex-row items-center justify-center rounded-xl p-4 ${canSave ? 'bg-primary-600' : 'bg-neutral-200'}`} onPress={handleSave} disabled={!canSave}>
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text className={`text-center font-bold ${canSave ? 'text-white' : 'text-gray-400'}`}>{t('esploraServer.save')}</Text>}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
