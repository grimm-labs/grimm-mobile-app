/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useContext, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { ListRenderItem } from 'react-native';
import { FlatList, Pressable } from 'react-native';
import * as z from 'zod';

import countries from '@/assets/data/countries.json';
import { HeaderLeft } from '@/components/back-button';
import { colors, ControlledInput, FocusAwareStatusBar, SafeAreaView, Text, TouchableOpacity, View } from '@/components/ui';
import type { ClearButtonProps, Country } from '@/interfaces';
import { AppContext } from '@/lib/context';

interface FormData {
  countrySearch: string;
}

interface CountryItemProps {
  country: Country;
  isSelected: boolean;
  onPress: (country: Country) => void;
}

interface EmptyStateProps {
  searchTerm: string;
}

const searchSchema = z.object({
  countrySearch: z.string().optional().default(''),
});

const ClearButton: React.FC<ClearButtonProps> = React.memo(({ onPress, visible }) => {
  if (!visible) return null;
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View className="flex flex-row items-center justify-center rounded p-1">
        <Ionicons name="close-circle-sharp" size={20} color={colors.neutral[500]} />
      </View>
    </Pressable>
  );
});

const CountryItem: React.FC<CountryItemProps> = React.memo(({ country, isSelected, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(country);
  }, [country, onPress]);

  return (
    <TouchableOpacity className="mb-4 flex flex-row items-center border-b border-gray-200 pb-2" onPress={handlePress} activeOpacity={0.7}>
      <View className="flex-1 flex-row items-center">
        <View className="flex h-6 w-10 items-center justify-center rounded bg-gray-100">
          <Text className="text-xs font-bold">{country.isoCode}</Text>
        </View>
        <View className="ml-2 flex flex-col">
          <Text className="text-lg font-medium text-gray-700">{country.name}</Text>
          <Text className="text-sm text-gray-500">+{country.callingCode}</Text>
        </View>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />}
    </TouchableOpacity>
  );
});

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ searchTerm }) => (
  <View className="flex-1 items-center justify-center py-8">
    <Text className="text-neutral-500">{searchTerm ? `No countries found for "${searchTerm}"` : 'No countries available'}</Text>
  </View>
));

const normalizeSearchTerm = (term: string): string => {
  return term.toLowerCase().trim();
};

const filterCountries = (searchTerm: string): Country[] => {
  if (!searchTerm.trim()) {
    return countries;
  }

  const normalizedTerm = normalizeSearchTerm(searchTerm);

  return countries.filter((country) => {
    const nameMatch = country.name.toLowerCase().includes(normalizedTerm);
    const codeMatch = country.isoCode.toLowerCase().includes(normalizedTerm);
    const callingCodeMatch = country.callingCode.includes(normalizedTerm);

    return nameMatch || codeMatch || callingCodeMatch;
  });
};

export default function SelectCountry() {
  const { selectedCountry, setSelectedCountry } = useContext(AppContext);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { countrySearch: '' },
  });

  const { control, watch, setValue } = form;
  const searchValue = watch('countrySearch') || '';

  const filteredCountries = useMemo(() => {
    return filterCountries(searchValue);
  }, [searchValue]);

  const handleCountrySelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      router.back();
    },
    [setSelectedCountry, router],
  );

  const renderCountryItem: ListRenderItem<Country> = useCallback(
    ({ item }) => <CountryItem country={item} isSelected={item.isoCode === selectedCountry.isoCode} onPress={handleCountrySelect} />,
    [selectedCountry.isoCode, handleCountrySelect],
  );

  const keyExtractor = useCallback((item: Country) => item.isoCode, []);

  const renderEmptyComponent = useCallback(() => <EmptyState searchTerm={searchValue} />, [searchValue]);

  const screenOptions = useMemo(
    () => ({
      headerLeft: HeaderLeft,
      headerTitleAlign: 'center' as const,
      headerTitle: () => (
        <View className="flex-row items-center">
          <Text className="text-lg">Select your country</Text>
        </View>
      ),
      headerRight: () => null,
      headerShadowVisible: false,
    }),
    [],
  );

  return (
    <SafeAreaView className="flex-1 border">
      <Stack.Screen options={screenOptions} />
      <FocusAwareStatusBar style="dark" />
      <View className="mt-0 h-full flex-1 border bg-white">
        <View className="mx-4 flex-1">
          <ControlledInput
            testID="countrySearchInput"
            name="countrySearch"
            placeholder="Search country..."
            placeholderClassName="text-base"
            keyboardType="web-search"
            control={control}
            autoCapitalize="none"
            prefix={
              <Pressable onPress={() => {}} hitSlop={8}>
                <View className="flex flex-row items-center justify-center rounded p-1">
                  <Ionicons name="search" size={24} color={colors.neutral[500]} />
                </View>
              </Pressable>
            }
            suffix={<ClearButton onPress={() => setValue('countrySearch', '')} visible={(searchValue?.length ?? 0) >= 1} />}
          />

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
        </View>
      </View>
    </SafeAreaView>
  );
}
