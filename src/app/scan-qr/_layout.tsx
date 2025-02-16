/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BarcodeScanningResult, CameraType, FlashMode } from 'expo-camera';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, TouchableOpacity, View } from 'react-native';

import { colors, FocusAwareStatusBar, Text } from '@/ui';

import NoCameraPermission from './no-camera-permission';

export default function ScanQrScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [_permission, _requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [flash, setFlash] = useState<FlashMode>('off');

  const checkCameraPermission = async () => {
    const permissionResponse = await Camera.requestCameraPermissionsAsync();
    setHasPermission(permissionResponse.granted);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const qrCodeScanned = ({ data }: BarcodeScanningResult) => {
    router.push({
      pathname: 'send/enter-address',
      params: { qrData: data },
    });
  };

  useEffect(() => {
    checkCameraPermission();
  }, []);

  if (!hasPermission) {
    return <NoCameraPermission />;
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: 'Scan QR',
          headerShown: true,
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <FocusAwareStatusBar />
      <View className="flex-1">
        <CameraView facing={facing} flash={flash} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={qrCodeScanned} className="flex-1">
          <View className="h-full items-center justify-center">
            <View className="flex h-full w-full">
              <View className="flex-1 items-center justify-center">
                <View className="mb-6 h-64 w-64 rounded-lg border-2 border-white bg-transparent" />
                <View className="rounded-full bg-white px-4 py-1">
                  <Text className="text-gray-600">Scan a Bitcoin or Lightning QR Code</Text>
                </View>
              </View>
              <View>
                <View className="flex w-full flex-row justify-center py-4">
                  <TouchableOpacity onPress={toggleCameraFacing} className="mr-2 rounded-full bg-white p-5">
                    <Ionicons name="camera-reverse" size={26} color={colors.neutral[700]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleFlash} className="ml-2 rounded-full bg-white p-5">
                    <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={26} color={colors.neutral[700]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}
