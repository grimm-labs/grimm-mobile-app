import {
  clampTransactionNoteInputHeight,
  getTransactionNoteSheetBottomInset,
  getTransactionNoteSheetContentHeight,
  NOTE_MAX_HEIGHT,
  NOTE_MIN_HEIGHT,
} from '../sheet-layout';

describe('getTransactionNoteSheetContentHeight', () => {
  it('computes height from header, input, button and padding', () => {
    expect(getTransactionNoteSheetContentHeight(NOTE_MIN_HEIGHT)).toBe(48 + 16 + NOTE_MIN_HEIGHT + 16 + 56 + 16);
  });
});

describe('clampTransactionNoteInputHeight', () => {
  it('clamps values below the minimum height', () => {
    expect(clampTransactionNoteInputHeight(10)).toBe(NOTE_MIN_HEIGHT);
  });

  it('clamps values above the maximum height', () => {
    expect(clampTransactionNoteInputHeight(999)).toBe(NOTE_MAX_HEIGHT);
  });

  it('keeps values within bounds unchanged', () => {
    expect(clampTransactionNoteInputHeight(120)).toBe(120);
  });
});

describe('getTransactionNoteSheetBottomInset', () => {
  it('uses the tab bar inset on iOS even when the keyboard is visible', () => {
    expect(
      getTransactionNoteSheetBottomInset({
        isIOS: true,
        isKeyboardVisible: true,
        keyboardHeight: 320,
        bottomInset: 56,
      }),
    ).toBe(56);
  });

  it('uses only the keyboard height on Android when the keyboard is visible', () => {
    expect(
      getTransactionNoteSheetBottomInset({
        isIOS: false,
        isKeyboardVisible: true,
        keyboardHeight: 320,
        bottomInset: 56,
      }),
    ).toBe(320);
  });

  it('uses the tab bar inset on Android when the keyboard is hidden', () => {
    expect(
      getTransactionNoteSheetBottomInset({
        isIOS: false,
        isKeyboardVisible: false,
        keyboardHeight: 0,
        bottomInset: 56,
      }),
    ).toBe(56);
  });
});
