import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React from 'react';

import { colors, Pressable, Switch, Text, View } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = 'default' | 'danger';

const ICON_SIZE = 18;

/** A titled group of rows on one card, with inset dividers between the rows (iOS grouped list). */
export const SettingsSection = ({ title, children, testID }: { title?: string; children: React.ReactNode; testID?: string }) => {
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View testID={testID} className="mt-8">
      {title ? <Text className={`mx-8 mb-2 text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>{title}</Text> : null}
      <View className={`mx-4 overflow-hidden rounded-2xl ${theme.card}`}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>
            {index > 0 && <View className="ml-16 h-px bg-gray-200 dark:bg-charcoal-700" />}
            {row}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const SettingsIcon = ({ icon, tone }: { icon: IconName; tone: Tone }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const color = tone === 'danger' ? colors.danger[isDark ? 400 : 600] : colors.primary[isDark ? 400 : 600];
  const background = tone === 'danger' ? 'bg-danger-500/10 dark:bg-danger-400/15' : 'bg-primary-600/10 dark:bg-primary-400/15';

  return (
    // Decorative: the row title says what it is
    <View className={`mr-3 size-9 items-center justify-center rounded-xl ${background}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ionicons name={icon} size={ICON_SIZE} color={color} />
    </View>
  );
};

const RowText = ({ title, subtitle, tone }: { title: string; subtitle?: string; tone: Tone }) => (
  <View className="flex-1 pr-3">
    <Text className={`text-base font-medium ${tone === 'danger' ? 'text-danger-600 dark:text-danger-400' : theme.textPrimary}`}>{title}</Text>
    {subtitle ? <Text className={`mt-0.5 text-sm leading-5 ${theme.textMuted}`}>{subtitle}</Text> : null}
  </View>
);

const rowClassName = 'min-h-14 flex-row items-center px-4 py-3.5 active:bg-gray-100 dark:active:bg-charcoal-800';

type SettingsItemProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
  /** `danger` for destructive actions (Log Out): red, without the chevron */
  tone?: Tone;
};

export const SettingsItem = ({ icon, title, subtitle, onPress, testID, tone = 'default' }: SettingsItemProps) => {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === 'dark' ? colors.charcoal[500] : colors.neutral[400];

  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button" className={rowClassName}>
      <SettingsIcon icon={icon} tone={tone} />
      <RowText title={title} subtitle={subtitle} tone={tone} />
      {tone === 'default' && <Ionicons name="chevron-forward" size={ICON_SIZE} color={chevronColor} />}
    </Pressable>
  );
};

type SettingsToggleItemProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** The row gets this testID, its switch `${testID}-switch` */
  testID: string;
};

/** A row with a switch: tapping anywhere on the row toggles it. */
export const SettingsToggleItem = ({ icon, title, subtitle, value, onValueChange, testID }: SettingsToggleItemProps) => (
  <Pressable testID={testID} onPress={() => onValueChange(!value)} className={rowClassName}>
    <SettingsIcon icon={icon} tone="default" />
    <RowText title={title} subtitle={subtitle} tone="default" />
    <Switch.Root testID={`${testID}-switch`} checked={value} onChange={onValueChange} accessibilityLabel={title}>
      <Switch.Icon checked={value} />
    </Switch.Root>
  </Pressable>
);
