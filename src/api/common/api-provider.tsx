/* eslint-disable react-hooks/rules-of-hooks */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

// Only import DevTools in development to avoid bundling in production
if (__DEV__) {
  require('@dev-plugins/react-query');
}

export const queryClient = new QueryClient();

function useDevTools() {
  if (__DEV__) {
    const { useReactQueryDevTools } = require('@dev-plugins/react-query');
    useReactQueryDevTools(queryClient);
  }
}

export function APIProvider({ children }: { children: React.ReactNode }) {
  // React Query DevTools — only active in development builds
  useDevTools();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
