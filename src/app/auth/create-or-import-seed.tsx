import { Ionicons } from '@expo/vector-icons';
import { Mnemonic } from 'bdk-rn';
import { WordCount } from 'bdk-rn/lib/lib/enums';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { AppContext } from '@/lib/context';

interface SeedOptionItemProps {
  title: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: () => void;
}

const SeedOptionItem: React.FC<SeedOptionItemProps> = ({ title, subtitle, isSelected, onSelect }) => {
  return (
    <TouchableOpacity onPress={onSelect} className={`mb-3 flex-row items-center justify-between rounded-lg border-2 p-4 ${isSelected ? 'border-primary-500' : 'border-gray-200'}`} activeOpacity={0.7}>
      <View className="flex-1 pr-4">
        <Text className={`mb-1 text-xl font-normal ${isSelected ? 'text-primary-600' : 'text-gray-900'}`}>{title}</Text>
        <Text className={`text-sm text-gray-600`}>{subtitle}</Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}
    </TouchableOpacity>
  );
};

export default function CreateOrImportSeed() {
  const { setSeedPhrase } = useContext(AppContext);
  const [selectedOption, setSelectedOption] = useState<'create' | 'import'>('create');
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedOption) return;

    if (selectedOption === 'create') {
      try {
        const newMnemonic = (await new Mnemonic().create(WordCount.WORDS12)).asString();
        if (!newMnemonic) {
          throw new Error('Failed to generate seed phrase');
        }
        setSeedPhrase(newMnemonic);
        router.push('/sync');
      } catch (error) {
        console.error('Error generating seed phrase:', error);
      }
    } else if (selectedOption === 'import') {
      router.push('/auth/import-seed-phrase');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: '',
              headerLeft: HeaderLeft,
              headerRight: () => null,
              headerShadowVisible: false,
            }}
          />
          <FocusAwareStatusBar style="dark" />

          <View className="flex-1">
            <ScreenTitle title="Set up your wallet" />
            <View className="mb-3" />

            <ScreenSubtitle subtitle="Choose how you want to set up your Bitcoin wallet. You can create a new seed phrase or import an existing one." />
            <View className="mb-3" />

            <View className="flex-1">
              <SeedOptionItem
                title="Create a new seed phrase"
                subtitle="Generate a new 12-word recovery phrase to secure your wallet"
                isSelected={selectedOption === 'create'}
                onSelect={() => setSelectedOption('create')}
              />
              <SeedOptionItem
                title="Import existing seed phrase"
                subtitle="Use your existing 12-word recovery phrase to restore your wallet"
                isSelected={selectedOption === 'import'}
                onSelect={() => setSelectedOption('import')}
              />
            </View>
          </View>
          <Button testID="login-button" label="Continue" fullWidth size="lg" variant="secondary" textClassName="text-base text-white" onPress={handleContinue} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
