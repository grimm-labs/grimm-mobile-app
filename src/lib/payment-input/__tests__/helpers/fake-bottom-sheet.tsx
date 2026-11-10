/**
 * @gorhom/bottom-sheet with a BottomSheetModal that behaves like the real one where the method sheet tests need it:
 * its content shows only once presented, and closing it (dismiss, backdrop, back button, swipe) calls `onDismiss`,
 * also after a choice. The package mock always shows the content and never calls `onDismiss`.
 * Use, on top of the package mock:
 * jest.mock('@gorhom/bottom-sheet', () => ({ ...require('@gorhom/bottom-sheet/mock'), ...require('@/lib/payment-input/__tests__/helpers/fake-bottom-sheet') }));
 */
import React from 'react';

type Props = { children?: React.ReactNode; onDismiss?: () => void };

const openSheets = new Set<BottomSheetModal>();

export class BottomSheetModal extends React.Component<Props, { isOpen: boolean }> {
  state = { isOpen: false };

  present() {
    openSheets.add(this);
    this.setState({ isOpen: true });
  }

  dismiss() {
    if (!openSheets.has(this)) return;
    openSheets.delete(this);
    this.setState({ isOpen: false });
    this.props.onDismiss?.();
  }

  snapToIndex() {}
  snapToPosition() {}
  expand() {}
  collapse() {}

  componentWillUnmount() {
    openSheets.delete(this);
  }

  render() {
    if (!this.state.isOpen) return null;
    return <>{this.props.children}</>;
  }
}

export const fakeBottomSheet = {
  /** Closes the open sheets without a choice, like a tap on the backdrop or the back button. */
  closeWithoutChoice() {
    [...openSheets].forEach((sheet) => sheet.dismiss());
  },
  isOpen: () => openSheets.size > 0,
};
