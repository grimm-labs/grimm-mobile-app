export const NOTE_LINE_HEIGHT = 20;
export const NOTE_MIN_LINES = 3;
export const NOTE_MAX_LINES = 8;
export const NOTE_VERTICAL_PADDING = 16;
export const NOTE_MIN_HEIGHT = NOTE_LINE_HEIGHT * NOTE_MIN_LINES + NOTE_VERTICAL_PADDING * 2;
export const NOTE_MAX_HEIGHT = NOTE_LINE_HEIGHT * NOTE_MAX_LINES + NOTE_VERTICAL_PADDING * 2;

const SHEET_HEADER_HEIGHT = 48;
const INPUT_CONTAINER_PADDING = 16;
const SECTION_GAP = 16;
const ACTION_BUTTON_HEIGHT = 56;
const CONTENT_BOTTOM_PADDING = 16;

export function getTransactionNoteSheetContentHeight(inputHeight: number): number {
  return SHEET_HEADER_HEIGHT + INPUT_CONTAINER_PADDING + inputHeight + SECTION_GAP + ACTION_BUTTON_HEIGHT + CONTENT_BOTTOM_PADDING;
}

export function clampTransactionNoteInputHeight(contentHeight: number): number {
  return Math.min(NOTE_MAX_HEIGHT, Math.max(NOTE_MIN_HEIGHT, contentHeight));
}

type SheetBottomInsetParams = {
  isIOS: boolean;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  bottomInset: number;
};

export function getTransactionNoteSheetBottomInset({ isIOS, isKeyboardVisible, keyboardHeight, bottomInset }: SheetBottomInsetParams): number {
  if (!isIOS && isKeyboardVisible) {
    return keyboardHeight;
  }

  return bottomInset;
}
