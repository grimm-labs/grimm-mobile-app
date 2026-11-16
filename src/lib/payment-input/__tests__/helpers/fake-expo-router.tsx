/**
 * Fake of expo-router with a stable router object, like the real singleton (a new object per render makes screens with
 * `router` in their effect deps loop forever, see AGENTS.md).
 * Use: jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
 */
import type { ReactNode } from 'react';
import React from 'react';

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismissAll: jest.fn(),
  canGoBack: jest.fn(() => true),
};

let searchParams: Record<string, string | undefined> = {};

export const useRouter = () => router;
export const useLocalSearchParams = () => searchParams;

export const Stack = {
  Screen: ({ children }: { children?: ReactNode }) => <>{children}</>,
};

export const fakeRouter = {
  setParams(params: Record<string, string | undefined>) {
    searchParams = params;
  },
  reset() {
    Object.values(router).forEach((fn) => fn.mockClear());
    searchParams = {};
  },
};
