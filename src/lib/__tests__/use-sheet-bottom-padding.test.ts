import { renderHook } from '@testing-library/react-native';

import { useSheetBottomPadding } from '../use-sheet-bottom-padding';

// jest-setup mocks this module for the screens: test the real one
jest.unmock('@/lib/use-sheet-bottom-padding');
jest.unmock('../use-sheet-bottom-padding');

let mockBottomInset = 34;
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: mockBottomInset, left: 0 }) }));

describe('useSheetBottomPadding', () => {
  it('keeps the sheet content clear of the home indicator, plus 16', () => {
    mockBottomInset = 34;
    expect(renderHook(() => useSheetBottomPadding()).result.current).toBe(50);
  });

  it('is 16 on a phone without a home indicator', () => {
    mockBottomInset = 0;
    expect(renderHook(() => useSheetBottomPadding()).result.current).toBe(16);
  });
});
