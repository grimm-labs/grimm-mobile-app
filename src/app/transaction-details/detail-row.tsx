/* eslint-disable react-native/no-inline-styles */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

import { Text, TouchableOpacity, View } from '@/components/ui';

interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  expandable?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, copyable = false, expandable = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const containerComponent = expandable ? TouchableOpacity : View;
  const containerProps = expandable ? { onPress: toggleExpand, activeOpacity: 0.7 } : {};

  return (
    <View className="mb-4 rounded-lg bg-gray-50 p-4">
      {React.createElement(
        containerComponent,
        {
          ...containerProps,
          className: expandable ? 'flex-row items-center justify-between' : '',
        },
        <>
          <View className={expandable ? 'flex-1' : ''}>
            <Text className="mb-1 text-sm font-medium text-gray-500">{label}</Text>
            <Text className="text-base text-gray-900" selectable={copyable} numberOfLines={expandable && !isExpanded ? 1 : undefined} ellipsizeMode={expandable && !isExpanded ? 'tail' : undefined}>
              {value}
            </Text>
          </View>
          {expandable && <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" style={{ marginLeft: 8 }} />}
        </>,
      )}
    </View>
  );
};

export default DetailRow;
