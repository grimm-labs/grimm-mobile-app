import { act, renderHook } from '@testing-library/react-native';

import { formatRemainingTime, useCountdown } from '../use-countdown';

describe('formatRemainingTime', () => {
  it.each([
    [0, '0:00'],
    [59, '0:59'],
    [60, '1:00'],
    [600, '10:00'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3661, '1:01:01'],
    [86399, '23:59:59'],
    [604800, '168:00:00'],
  ])('formats %i seconds as %s', (input, expected) => {
    expect(formatRemainingTime(input)).toBe(expected);
  });

  it('clamps negative values to zero', () => {
    expect(formatRemainingTime(-5)).toBe('0:00');
  });

  it('floors fractional seconds', () => {
    expect(formatRemainingTime(61.9)).toBe('1:01');
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null remaining time when no deadline is set', () => {
    const { result } = renderHook(() => useCountdown(null));

    expect(result.current.remainingSecs).toBeNull();
    expect(result.current.isExpired).toBe(false);
  });

  it('counts down every second until the deadline', () => {
    const expiresAt = Date.now() + 3000;
    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.remainingSecs).toBe(3);
    expect(result.current.isExpired).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSecs).toBe(2);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSecs).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('never goes below zero once the deadline has passed', () => {
    const expiresAt = Date.now() + 1000;
    const { result } = renderHook(() => useCountdown(expiresAt));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSecs).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('resets when the deadline is cleared', () => {
    const { result, rerender } = renderHook(({ expiresAt }: { expiresAt: number | null }) => useCountdown(expiresAt), {
      initialProps: { expiresAt: Date.now() + 10000 } as { expiresAt: number | null },
    });

    expect(result.current.remainingSecs).toBe(10);

    rerender({ expiresAt: null });

    expect(result.current.remainingSecs).toBeNull();
    expect(result.current.isExpired).toBe(false);
  });

  it('restarts from a new deadline', () => {
    const { result, rerender } = renderHook(({ expiresAt }: { expiresAt: number | null }) => useCountdown(expiresAt), {
      initialProps: { expiresAt: Date.now() + 2000 } as { expiresAt: number | null },
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.isExpired).toBe(true);

    rerender({ expiresAt: Date.now() + 30000 });

    expect(result.current.remainingSecs).toBe(30);
    expect(result.current.isExpired).toBe(false);
  });

  it('clears the interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useCountdown(Date.now() + 5000));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
