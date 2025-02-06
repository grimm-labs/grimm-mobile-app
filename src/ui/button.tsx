import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import type { PressableProps, View } from 'react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

const button = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-full px-4',
    label: 'font-inter text-base font-semibold',
    indicator: 'h-6 text-white',
    icon: 'mr-2',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-black dark:bg-white',
        label: 'text-white dark:text-black',
        indicator: 'text-white dark:text-black',
        icon: 'text-white dark:text-black',
      },
      secondary: {
        container: 'bg-primary-600',
        label: 'text-secondary-600',
        indicator: 'text-white',
        icon: 'text-white',
      },
      outline: {
        container: 'border border-neutral-400',
        label: 'text-black dark:text-neutral-100',
        indicator: 'text-black dark:text-neutral-100',
        icon: 'text-black dark:text-neutral-100',
      },
      destructive: {
        container: 'bg-red-600',
        label: 'text-white',
        indicator: 'text-white',
        icon: 'text-white',
      },
      ghost: {
        container: 'bg-transparent',
        label: 'text-black underline dark:text-white',
        indicator: 'text-black dark:text-white',
        icon: 'text-black dark:text-white',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-black',
        indicator: 'text-black',
        icon: 'text-black',
      },
    },
    size: {
      default: {
        container: 'h-10 px-4',
        label: 'text-base',
        icon: 'text-xl',
      },
      lg: {
        container: 'h-14 px-8',
        label: 'text-xl',
        icon: 'text-2xl',
      },
      sm: {
        container: 'h-8 px-3',
        label: 'text-sm',
        indicator: 'h-2',
        icon: 'text-lg',
      },
      icon: { container: 'h-9 w-9', icon: 'text-xl' },
    },
    disabled: {
      true: {
        container: 'bg-neutral-300 dark:bg-neutral-300',
        label: 'text-neutral-600 dark:text-neutral-600',
        indicator: 'text-neutral-400 dark:text-neutral-400',
        icon: 'text-neutral-400 dark:text-neutral-400',
      },
    },
    fullWidth: {
      true: {
        container: '',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props extends ButtonVariants, Omit<PressableProps, 'disabled'> {
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<View, Props>(
  ({ label: text, loading = false, variant = 'default', disabled = false, size = 'default', className = '', testID, textClassName = '', icon, iconPosition = 'left', ...props }, ref) => {
    const styles = React.useMemo(() => button({ variant, disabled, size }), [variant, disabled, size]);

    const renderIcon = () => {
      if (!icon) return null;

      const iconColor = variant === 'default' ? (disabled ? '#6B7280' : '#FFFFFF') : disabled ? '#6B7280' : '#000000';

      return <Ionicons name={icon} size={16} color={iconColor} className={styles.icon()} />;
    };

    return (
      <Pressable disabled={disabled || loading} className={styles.container({ className })} {...props} ref={ref} testID={testID}>
        {props.children ? (
          props.children
        ) : (
          <>
            {loading ? (
              <ActivityIndicator size="small" className={styles.indicator()} testID={testID ? `${testID}-activity-indicator` : undefined} />
            ) : (
              <>
                {iconPosition === 'left' && renderIcon()}
                {text && (
                  <Text testID={testID ? `${testID}-label` : undefined} className={styles.label({ className: textClassName })}>
                    {text}
                  </Text>
                )}
                {iconPosition === 'right' && renderIcon()}
              </>
            )}
          </>
        )}
      </Pressable>
    );
  }
);
