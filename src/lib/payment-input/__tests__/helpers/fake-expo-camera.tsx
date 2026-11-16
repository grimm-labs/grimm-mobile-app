/**
 * expo-camera with the permission granted and a CameraView that keeps its `onBarcodeScanned` prop, so a test can
 * "scan" a Payment Input. The scanner sets the prop to undefined while it does not scan.
 * Use: jest.mock('expo-camera', () => require('@/lib/payment-input/__tests__/helpers/fake-expo-camera'));
 */
import React from 'react';
import { View } from 'react-native';

type OnBarcodeScanned = ((result: { data: string }) => void | Promise<void>) | undefined;
type CameraProps = { onBarcodeScanned?: OnBarcodeScanned; facing?: string; enableTorch?: boolean };
type Permission = { granted: boolean; status: string; canAskAgain: boolean; expires: string } | null;

const GRANTED: Permission = { granted: true, status: 'granted', canAskAgain: true, expires: 'never' };

let onBarcodeScanned: OnBarcodeScanned;
let lastProps: CameraProps = {};
let permission: Permission = GRANTED;
const requestPermission = jest.fn(async () => permission);

export const useCameraPermissions = () => [permission, requestPermission];

export const CameraView = (props: CameraProps) => {
  onBarcodeScanned = props.onBarcodeScanned;
  lastProps = props;
  return <View testID="fake-camera" />;
};

export const fakeCamera = {
  /** Whether the scanner listens to the camera right now. */
  isScanning: () => onBarcodeScanned !== undefined,
  /** Scans a QR code; does nothing while the scanner does not listen, like the real camera. */
  async scan(data: string) {
    await onBarcodeScanned?.({ data });
  },
  /** The props of the last CameraView rendered (facing, enableTorch…). */
  props: () => lastProps,
  /** null: not asked yet; { granted: false }: refused. */
  setPermission(next: Permission) {
    permission = next;
  },
  requestPermission,
  reset() {
    onBarcodeScanned = undefined;
    lastProps = {};
    permission = GRANTED;
    requestPermission.mockClear();
  },
};
