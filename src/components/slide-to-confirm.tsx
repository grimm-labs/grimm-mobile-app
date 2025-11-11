import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 32;
const KNOB_SIZE = 60;

interface SlideToConfirmProps {
  onConfirm: () => void;
  confirmThreshold?: number;
  loading?: boolean;
  disabled?: boolean;
}

const SlideToConfirm: React.FC<SlideToConfirmProps> = ({ onConfirm, confirmThreshold = 0.9, loading = false, disabled = false }) => {
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const reset = () => {
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const confirmAction = () => {
    if (!loading && !disabled) {
      onConfirm();
      reset();
    }
  };

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      if (loading || disabled) return;
      context.startX = translateX.value;
      isDragging.value = true;
    },
    onActive: (event, context) => {
      if (loading || disabled) return;
      const newValue = context.startX + event.translationX;
      translateX.value = Math.max(0, Math.min(newValue, SLIDER_WIDTH - KNOB_SIZE));
    },
    onEnd: () => {
      if (loading || disabled) return;
      isDragging.value = false;
      if (translateX.value > (SLIDER_WIDTH - KNOB_SIZE) * confirmThreshold) {
        translateX.value = withSpring(SLIDER_WIDTH - KNOB_SIZE);
        runOnJS(confirmAction)();
      } else {
        runOnJS(reset)();
      }
    },
  });

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: translateX.value + KNOB_SIZE,
  }));

  const isInactive = loading || disabled;

  return (
    <View>
      <View className={`h-[60px] w-full justify-center overflow-hidden rounded-full ${isInactive ? 'bg-gray-200' : 'bg-gray-100'}`}>
        <Animated.View className={`absolute left-0 h-full rounded-full ${isInactive ? 'bg-gray-400' : 'bg-primary-600'} opacity-30`} style={progressStyle} />
        <Text className={`absolute w-full text-center text-sm font-medium ${isInactive ? 'text-gray-400' : 'text-gray-500'}`}>
          {loading ? 'Processing...' : disabled ? 'Slide disabled' : 'Slide to confirm transaction'}
        </Text>
        <PanGestureHandler onGestureEvent={panGestureHandler} enabled={!isInactive}>
          <Animated.View className={`absolute size-[60px] items-center justify-center rounded-full ${isInactive ? 'bg-gray-400' : 'bg-primary-600'}`} style={sliderStyle}>
            {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="arrow-forward-sharp" size={22} color="white" />}
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
};

export default SlideToConfirm;
