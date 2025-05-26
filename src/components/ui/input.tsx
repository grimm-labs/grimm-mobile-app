/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import type { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { useController } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import { I18nManager, StyleSheet, View } from 'react-native';
import { TextInput as NTextInput } from 'react-native';
import { tv } from 'tailwind-variants';

import colors from './colors';
import { Text } from './text';

const inputTv = tv({
  slots: {
    container: 'mb-2 flex-row items-center rounded-xl bg-neutral-200 p-1',
    label: 'text-grey-100 mb-1 text-lg dark:text-neutral-100',
    input: 'mt-0 flex-1 rounded-xl px-4 py-3 font-inter text-base font-medium leading-5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white',
  },

  variants: {
    focused: {
      true: {
        input: 'border-neutral-400 dark:border-neutral-300',
      },
    },
    error: {
      true: {
        input: 'border-danger-600',
        label: 'text-danger-600 dark:text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200',
      },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    disabled: false,
  },
});

export interface NInputProps extends TextInputProps {
  label?: string;
  disabled?: boolean;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

type TRule<T extends FieldValues> = Omit<RegisterOptions<T>, 'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'> | undefined;

export type RuleType<T extends FieldValues> = { [name in keyof T]: TRule<T> };
export type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  rules?: RuleType<T>;
};

interface ControlledInputProps<T extends FieldValues> extends NInputProps, InputControllerType<T> {}

export const Input = React.forwardRef<NTextInput, NInputProps>((props, ref) => {
  const { label, error, testID, prefix, suffix, disabled, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);
  const onBlur = React.useCallback(() => setIsFocussed(false), []);
  const onFocus = React.useCallback(() => setIsFocussed(true), []);

  const styles = React.useMemo(
    () =>
      inputTv({
        error: Boolean(error),
        focused: isFocussed,
        disabled: Boolean(disabled),
      }),
    [error, isFocussed, disabled],
  );

  return (
    <View>
      <View className={styles.container()} pointerEvents={disabled ? 'none' : 'auto'}>
        {label && (
          <Text testID={testID ? `${testID}-label` : undefined} className={styles.label()}>
            {label}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {prefix && <View className="ml-2">{prefix}</View>}
          <NTextInput
            testID={testID}
            ref={ref}
            placeholderTextColor={colors.neutral[400]}
            className={styles.input()}
            onBlur={onBlur}
            onFocus={onFocus}
            editable={!disabled}
            {...inputProps}
            style={StyleSheet.flatten([{ writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' }, { textAlign: I18nManager.isRTL ? 'right' : 'left' }, inputProps.style])}
          />
          {suffix && <View className="mr-2">{suffix}</View>}
        </View>
      </View>
      {error && (
        <Text testID={testID ? `${testID}-error` : undefined} className="mt-1 text-sm font-bold text-danger-500 dark:text-danger-600">
          {error}
        </Text>
      )}
    </View>
  );
});

export function ControlledInput<T extends FieldValues>(props: ControlledInputProps<T>) {
  const { name, control, rules, ...inputProps } = props;

  const { field, fieldState } = useController({ control, name, rules });
  return <Input ref={field.ref} autoCapitalize="none" onChangeText={field.onChange} value={(field.value as string) || ''} {...inputProps} error={fieldState.error?.message} />;
}
