/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ListRenderItem } from 'react-native';
import { FlatList, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import countries from '@/assets/data/countries.json';
import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { Button, colors, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import type { Country } from '@/interfaces';
import { AppContext } from '@/lib/context';

interface EmptyStateProps {
  searchTerm: string;
}

interface CountryItemProps {
  country: Country;
  isSelected: boolean;
  onPress: (country: Country) => void;
}

const CountryItem: React.FC<CountryItemProps> = React.memo(({ country, isSelected, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(country);
  }, [country, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <View className="flex flex-row items-center justify-between border-b-[0.5px] border-gray-300 py-4">
        <View className="flex-1">
          <Text className="text-sm font-medium">{country.name}</Text>
          <Text className="text-xs text-gray-500">
            {country.region} • {country.currency} • +{country.callingCode}
          </Text>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}
      </View>
    </Pressable>
  );
});

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ searchTerm }) => {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-neutral-500">{searchTerm ? t('country.no_results', { searchTerm }) : t('country.no_countries')}</Text>
    </View>
  );
});

export default function CountrySelector() {
  const { t } = useTranslation();
  const { selectedCountry, setSelectedCountry } = useContext(AppContext);
  const router = useRouter();
  const [localSelectedCountry, setLocalSelectedCountry] = useState(selectedCountry);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;

    const query = searchQuery.toLowerCase();
    return countries.filter(
      (country) => country.name.toLowerCase().includes(query) || country.nameFr.toLowerCase().includes(query) || country.isoCode.toLowerCase().includes(query) || country.region.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleSave = () => {
    setSelectedCountry(localSelectedCountry);
    router.back();
  };

  const keyExtractor = useCallback((item: Country) => item.isoCode, []);

  const renderEmptyComponent = useCallback(() => <EmptyState searchTerm={searchQuery} />, [searchQuery]);

  const handleCountrySelect = useCallback(
    (country: Country) => {
      setLocalSelectedCountry(country);
    },
    [setLocalSelectedCountry],
  );

  const renderCountryItem: ListRenderItem<Country> = useCallback(
    ({ item }) => <CountryItem country={item} isSelected={item.isoCode === localSelectedCountry.isoCode} onPress={handleCountrySelect} />,
    [localSelectedCountry.isoCode, handleCountrySelect],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full px-4">
          <Stack.Screen
            options={{
              headerTitleAlign: 'center',
              headerTitle: () => <HeaderTitle title={t('country.header_title')} />,
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />
          <View className="pb-4">
            <View className=" flex flex-row items-center rounded-lg bg-gray-100 px-3 py-2">
              <Ionicons name="search-outline" size={20} color={colors.neutral[500]} />
              <TextInput className="ml-2 flex-1 text-sm" placeholder={t('country.search_placeholder')} value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.neutral[500]} />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            windowSize={10}
            initialNumToRender={15}
            getItemLayout={(data, index) => ({
              length: 68,
              offset: 68 * index,
              index,
            })}
          />

          <View>
            <Button label={t('common.save')} onPress={handleSave} fullWidth={true} variant="secondary" textClassName="text-base text-white" size="lg" />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
