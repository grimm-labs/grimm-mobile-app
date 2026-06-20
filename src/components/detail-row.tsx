/* eslint-disable react-native/no-inline-styles */
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';

import { colors, Text, TouchableOpacity, View } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  expandable?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, copyable = false, expandable = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === 'dark' ? colors.charcoal[300] : colors.neutral[500];

  const toggleExpand = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const containerComponent = expandable ? TouchableOpacity : View;
  const containerProps = expandable ? { onPress: toggleExpand, activeOpacity: 0.7 } : {};

  return (
    <View className={`mb-4 rounded-lg p-4 ${theme.card}`}>
      {React.createElement(
        containerComponent,
        {
          ...containerProps,
          className: expandable ? 'flex-row items-center justify-between' : '',
        },
        <>
          <View className={expandable ? 'flex-1' : ''}>
            <Text className={`mb-1 text-sm font-medium ${theme.textMuted}`}>{label}</Text>
            <Text className={`text-base ${theme.textPrimary}`} selectable={copyable} numberOfLines={expandable && !isExpanded ? 1 : undefined} ellipsizeMode={expandable && !isExpanded ? 'tail' : undefined}>
              {value}
            </Text>
          </View>
          {expandable && <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={chevronColor} style={{ marginLeft: 8 }} />}
        </>,
      )}
    </View>
  );
};

export default DetailRow;
