import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';

import { Text } from '@/components/ui';

const HelpButton = memo(() => {
  const router = useRouter();

  const handleHelpPress = () => {
    router.push('/need-help');
  };

  return (
    <TouchableOpacity onPress={handleHelpPress}>
      <Text className="font-bold text-success-700">Help</Text>
    </TouchableOpacity>
  );
});

export default HelpButton;
