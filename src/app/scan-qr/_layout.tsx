/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BarcodeScanningResult, CameraType, FlashMode } from 'expo-camera';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, SafeAreaView, TouchableOpacity, View } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, FocusAwareStatusBar } from '@/ui';

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
    return (
      <SafeAreaView>
        <View className="flex h-full justify-between px-4">
          <Stack.Screen
            options={{
              title: 'Scan QR',
              headerShown: true,
              headerShadowVisible: false,
              headerBackTitleVisible: false,
            }}
          />
          <FocusAwareStatusBar />
          <View className="flex-1 items-center justify-center">
            <ScreenTitle title="No Camera Access" className="text-center text-2xl font-medium" />
            <View className="mb-4" />
            <ScreenSubtitle subtitle="Grimm App doesn't have access to the camera. Please enable camera access to scan QR codes." className="text-center" />
            <View className="mb-4" />
            <Button
              testID="login-button"
              label="Open Settings"
              variant="outline"
              className="mb-4"
              textClassName="text-base"
              onPress={async () => {
                await Linking.openURL('app-settings:');
              }}
              icon="cog"
            />
          </View>
          <View className="">
            <Button testID="login-button" label="Show Receive Address" variant="secondary" size="lg" textClassName="text-base" onPress={() => router.push('receive')} icon="qr-code" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Scan QR',
          headerShown: true,
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center">
        <CameraView facing={facing} flash={flash} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={qrCodeScanned} className="h-full w-full flex-1 items-center justify-center border border-danger-500">
          <View className="h-48 w-48 rounded-xl border-2 border-white" />
        </CameraView>
      </View>

      <View className="flex w-full flex-row justify-center space-x-4">
        <TouchableOpacity onPress={toggleCameraFacing} className="mr-2 rounded-full bg-gray-800 p-5">
          <Ionicons name="camera-reverse" size={26} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFlash} className="ml-2 rounded-full bg-gray-800 p-5">
          <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={26} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
