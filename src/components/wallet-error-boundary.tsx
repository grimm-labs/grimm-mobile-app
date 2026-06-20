import React, { type ErrorInfo, type ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/ui';
import { theme } from '@/lib/theme-classes';

interface Props {
  children: ReactNode;
  /** Label shown in the error UI so users know which subsystem failed */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches runtime errors in wallet provider subtrees (BDK, Breez, Spark)
 * so that a crash in one provider does not take down the entire app.
 *
 * Displays a minimal fallback UI with a retry button.
 */
export class WalletErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[WalletErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className={`flex-1 items-center justify-center p-6 ${theme.screen}`}>
          <Text className={`mb-2 text-center text-lg font-semibold ${theme.textPrimary}`}>{this.props.name ? `${this.props.name} encountered an error` : 'Something went wrong'}</Text>
          <Text className={`mb-6 text-center text-sm leading-5 ${theme.textSecondary}`}>{this.state.error?.message ?? 'An unexpected error occurred.'}</Text>
          <TouchableOpacity className="rounded-lg bg-primary-600 px-6 py-3" onPress={this.handleRetry}>
            <Text className="text-base font-semibold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
