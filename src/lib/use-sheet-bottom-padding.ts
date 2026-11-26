import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Space between the last element of a sheet and the bottom of its content area. */
export const SHEET_CONTENT_SPACING = 16;

/**
 * Bottom padding for the content of a bottom sheet.
 *
 * Bottom sheets start at the bottom edge of the screen and cover the tab bar (Material 3 and Apple HIG): the sheet is
 * never lifted above the tab bar. Its content keeps clear of the home indicator / navigation bar with this padding.
 */
export function useSheetBottomPadding() {
  const insets = useSafeAreaInsets();
  return insets.bottom + SHEET_CONTENT_SPACING;
}
