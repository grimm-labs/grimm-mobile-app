/* eslint-disable max-lines-per-function */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BarcodeScanningResult, CameraType, FlashMode } from 'expo-camera';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

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
          headerShown: false,
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <FocusAwareStatusBar />

      {/* Header avec boutons Fermer et Flash */}
      <View className="absolute left-5 top-5 z-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
      </View>
      <View className="absolute right-5 top-5 z-10">
        <TouchableOpacity onPress={toggleFlash}>
          <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View className="flex-1 items-center justify-center">
        <CameraView facing={facing} flash={flash} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={qrCodeScanned} className="flex h-full w-full items-center justify-center">
          {/* QR Code Scanner Guide */}
          <View className="absolute left-1/4 top-1/4 h-1/4 w-1/2 rounded-lg border-4 border-blue-500 opacity-75" />

          {/* Instruction Text */}
          <View className="rounded-lg border border-white">
            <Text className="absolute bottom-1/2 px-4 text-center text-lg text-white">Place the QR code in the center to scan a Bitcoin address or invoice.</Text>
          </View>
        </CameraView>
      </View>

      <View className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <TouchableOpacity onPress={toggleCameraFacing} className="rounded-full bg-gray-800 p-4">
          <Ionicons name="camera-reverse" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
