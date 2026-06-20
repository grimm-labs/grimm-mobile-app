/* eslint-disable react-native/no-inline-styles */
/**
 * Modal
 * Dependencies:
 * - @gorhom/bottom-sheet.
 *
 * Props:
 * - All `BottomSheetModalProps` props.
 * - `title` (string | undefined): Optional title for the modal header.
 *
 * Usage Example:
 * import { Modal, useModal } from '@gorhom/bottom-sheet';
 *
 * function DisplayModal() {
 *   const { ref, present, dismiss } = useModal();
 *
 *   return (
 *     <View>
 *       <Modal
 *         snapPoints={['60%']} // optional
 *         title="Modal Title"
 *         ref={ref}
 *       >
 *         Modal Content
 *       </Modal>
 *     </View>
 *   );
 * }
 *
 */

import type { BottomSheetBackdropProps, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal, useBottomSheet } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';

import { useModalBottomInset } from '@/lib/use-modal-bottom-inset';

import colors from './colors';
import { Text } from './text';

type ModalProps = BottomSheetModalProps & {
  title?: string;
  showCloseButton?: boolean;
};

type ModalRef = React.ForwardedRef<BottomSheetModal>;

type ModalHeaderProps = {
  title?: string;
  dismiss: () => void;
  showCloseButton?: boolean;
};

export const useModal = () => {
  const ref = React.useRef<BottomSheetModal>(null);
  const present = React.useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const dismiss = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);
  return { ref, present, dismiss };
};

export const Modal = React.forwardRef(
  ({ snapPoints: _snapPoints = ['60%'], title, detached = false, showCloseButton = true, backgroundStyle, bottomInset, enableDynamicSizing = false, ...props }: ModalProps, ref: ModalRef) => {
    const detachedProps = React.useMemo(() => getDetachedProps(detached), [detached]);
    const modal = useModal();
    const snapPoints = React.useMemo(() => _snapPoints, [_snapPoints]);
    const { colorScheme } = useColorScheme();
    const defaultBottomInset = useModalBottomInset();

    const resolvedBottomInset = bottomInset ?? (detached ? Math.max(46, defaultBottomInset) : defaultBottomInset);

    const themedBackgroundStyle = React.useMemo(() => {
      const baseStyle = {
        backgroundColor: colorScheme === 'dark' ? colors.charcoal[900] : colors.white,
      };

      if (backgroundStyle && typeof backgroundStyle === 'object' && !Array.isArray(backgroundStyle)) {
        return { ...baseStyle, ...backgroundStyle };
      }

      return baseStyle;
    }, [backgroundStyle, colorScheme]);

    React.useImperativeHandle(ref, () => (modal.ref.current as BottomSheetModal) || null);

    const handleBottomMargin = title || showCloseButton ? 'mb-8' : 'mb-2';

    const renderHandleComponent = React.useCallback(
      () => (
        <>
          <View className={`mt-4 h-2 w-16 self-center rounded-lg bg-gray-300 dark:bg-gray-700 ${handleBottomMargin}`} />
          <ModalHeader title={title} dismiss={modal.dismiss} showCloseButton={showCloseButton} />
        </>
      ),
      [handleBottomMargin, title, modal.dismiss, showCloseButton],
    );

    return (
      <BottomSheetModal
        {...props}
        {...detachedProps}
        ref={modal.ref}
        index={enableDynamicSizing ? undefined : 0}
        snapPoints={enableDynamicSizing ? undefined : snapPoints}
        backdropComponent={props.backdropComponent || renderBackdrop}
        enableDynamicSizing={enableDynamicSizing}
        handleComponent={renderHandleComponent}
        backgroundStyle={themedBackgroundStyle}
        bottomInset={resolvedBottomInset}
      />
    );
  },
);

/**
 * Custom Backdrop
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CustomBackdrop = ({ style }: BottomSheetBackdropProps) => {
  const { close } = useBottomSheet();
  return <AnimatedPressable onPress={() => close()} entering={FadeIn.duration(50)} exiting={FadeOut.duration(20)} style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />;
};

export const renderBackdrop = (props: BottomSheetBackdropProps) => <CustomBackdrop {...props} />;

/**
 *
 * @param detached
 * @returns
 *
 * @description
 * In case the modal is detached, we need to add some extra props to the modal to make it look like a detached modal.
 */

const getDetachedProps = (detached: boolean) => {
  if (detached) {
    return {
      detached: true,
      style: { marginHorizontal: 16, overflow: 'hidden' },
    } as Partial<BottomSheetModalProps>;
  }
  return {} as Partial<BottomSheetModalProps>;
};

/**
 * ModalHeader
 */

const ModalHeader = React.memo(({ title, dismiss, showCloseButton = true }: ModalHeaderProps) => {
  return (
    <>
      {title && (
        <View className="flex-row px-2 py-4">
          <View className="size-[24px]" />
          <View className="flex-1">
            <Text className="text-center text-[16px] font-bold text-gray-900 dark:text-charcoal-100">{title}</Text>
          </View>
        </View>
      )}
      {showCloseButton && <CloseButton close={dismiss} />}
    </>
  );
});

const CloseButton = ({ close }: { close: () => void }) => {
  const { colorScheme } = useColorScheme();
  const fillColor = colorScheme === 'dark' ? colors.charcoal[200] : colors.neutral[500];

  return (
    <Pressable
      onPress={close}
      className="absolute right-3 top-3 size-[24px] items-center justify-center "
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      accessibilityLabel="close modal"
      accessibilityRole="button"
      accessibilityHint="closes the modal"
    >
      <Svg width={24} height={24} fill="none" viewBox="0 0 24 24">
        <Path
          fill={fillColor}
          d="M18.707 6.707a1 1 0 0 0-1.414-1.414L12 10.586 6.707 5.293a1 1 0 0 0-1.414 1.414L10.586 12l-5.293 5.293a1 1 0 1 0 1.414 1.414L12 13.414l5.293 5.293a1 1 0 0 0 1.414-1.414L13.414 12l5.293-5.293Z"
        />
      </Svg>
    </Pressable>
  );
};
