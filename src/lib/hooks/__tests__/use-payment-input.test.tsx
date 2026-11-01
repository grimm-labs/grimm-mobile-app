jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));
jest.mock('expo-router', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-router'));
jest.mock('@/lib/context/breez-context', () => require('@/lib/payment-input/__tests__/helpers/fake-breez-context'));

import { act, renderHook } from '@/lib/test-utils';
import { fakeBreez } from '@/lib/payment-input/__tests__/helpers/fake-breez-context';
import { fakeRouter, router } from '@/lib/payment-input/__tests__/helpers/fake-expo-router';

import { usePaymentInput } from '../use-payment-input';

// The hook is tested through the four entry points in src/lib/payment-input/__tests__/entry-points.test.tsx;
// these tests cover what no screen can reach

beforeEach(() => {
  fakeBreez.reset();
  fakeRouter.reset();
});

describe('usePaymentInput', () => {
  it('a method choice without a Bitcoin URI waiting for it does nothing', async () => {
    const onError = jest.fn();
    const { result } = renderHook(() => usePaymentInput({ navigation: 'push', onError }));

    await act(() => result.current.methodSheet.onSelect('onchain'));

    expect(router.push).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('routeInput keeps its identity when the screen passes new callbacks, and uses the latest ones', async () => {
    const firstOnError = jest.fn();
    const latestOnError = jest.fn();
    const { result, rerender } = renderHook(({ onError }) => usePaymentInput({ navigation: 'push', onError }), { initialProps: { onError: firstOnError } });
    const { routeInput } = result.current;

    rerender({ onError: latestOnError });
    await act(() => result.current.routeInput(''));

    expect(result.current.routeInput).toBe(routeInput);
    expect(latestOnError).toHaveBeenCalledWith('empty');
    expect(firstOnError).not.toHaveBeenCalled();
  });
});
