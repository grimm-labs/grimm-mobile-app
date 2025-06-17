import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 32;
const KNOB_SIZE = 60;

interface SlideToConfirmProps {
  onConfirm: () => void;
  confirmThreshold?: number;
}

const SlideToConfirm: React.FC<SlideToConfirmProps> = ({ onConfirm, confirmThreshold = 0.9 }) => {
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const reset = () => {
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const confirmAction = () => {
    onConfirm();
    reset();
  };

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      isDragging.value = true;
    },
    onActive: (event, context) => {
      const newValue = context.startX + event.translationX;
      translateX.value = Math.max(0, Math.min(newValue, SLIDER_WIDTH - KNOB_SIZE));
    },
    onEnd: () => {
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

  return (
    <View>
      <View className="h-[60px] w-full justify-center overflow-hidden rounded-full bg-gray-100">
        <Animated.View className="absolute left-0 h-full rounded-full bg-primary-600 opacity-30" style={progressStyle} />
        <Text className="absolute w-full text-center text-sm font-medium text-gray-500">Slide to confirm transaction</Text>
        <PanGestureHandler onGestureEvent={panGestureHandler}>
          <Animated.View className="absolute size-[60px] items-center justify-center rounded-full bg-primary-600" style={sliderStyle}>
            <Ionicons name="arrow-forward-sharp" size={22} color="white" />
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
};

export default SlideToConfirm;
