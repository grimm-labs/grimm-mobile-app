/**
 * AppState emitter for the App Lock tests (the pattern of src/components/__tests__/privacy-overlay.test.tsx).
 * Call installAppStateEmitter() in beforeEach and restore the returned spy in afterEach.
 */
import { act } from '@testing-library/react-native';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

const listeners = new Set<(state: AppStateStatus) => void>();

export function installAppStateEmitter() {
  listeners.clear();
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
  return jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    listeners.add(listener as (state: AppStateStatus) => void);
    return { remove: () => listeners.delete(listener as (state: AppStateStatus) => void) } as ReturnType<typeof AppState.addEventListener>;
  });
}

export function emitAppState(state: AppStateStatus) {
  act(() => {
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: state });
    listeners.forEach((listener) => listener(state));
  });
}
