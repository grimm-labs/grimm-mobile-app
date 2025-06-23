/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import type { CameraType } from 'expo-camera';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { ScreenTitle } from '@/components/screen-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, TouchableOpacity, View } from '@/components/ui';

const ScanQrHeaderTitle = () => <HeaderTitle title="Scan QR" />;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SCAN_FRAME_SIZE = screenWidth * 0.6;

export default function ScanQrScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const router = useRouter();

  const scanTimeoutRef = useRef<number | null>(null);

  const checkCameraPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    checkCameraPermission();
  }, [checkCameraPermission]);

  const handleQrCodeDetected = useCallback(
    (qrData: string) => {
      router.push({
        pathname: '/send/enter-address',
        params: {
          input: qrData,
        },
      });
    },
    [router],
  );

  const handleQrCodeScanned = useCallback(
    ({ type, data }: { type: string; data: string }) => {
      if (!isScanning) return;

      setIsScanning(false);

      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      console.log('QR Code:', { type, data });

      handleQrCodeDetected(data);

      scanTimeoutRef.current = setTimeout(() => {
        setIsScanning(true);
      }, 3000);
    },
    [handleQrCodeDetected, isScanning],
  );

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashEnabled((current) => !current);
  };

  const toggleClose = () => {
    router.replace('/');
  };

  const ScanFrame = () => (
    <View
      style={{
        position: 'absolute',
        top: (screenHeight - SCAN_FRAME_SIZE) / 2 - 100,
        left: (screenWidth - SCAN_FRAME_SIZE) / 2,
        width: SCAN_FRAME_SIZE,
        height: SCAN_FRAME_SIZE,
        backgroundColor: 'transparent',
      }}
    >
      <View style={{ position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.white, borderRadius: 8 }} />
      <View style={{ position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.white, borderRadius: 8 }} />
      <View style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.white, borderRadius: 8 }} />
      <View style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.white, borderRadius: 8 }} />
    </View>
  );

  if (!permission) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack.Screen
            options={{
              headerTitleAlign: 'center',
              headerTitle: ScanQrHeaderTitle,
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
            <Text>Camera permission is required to scan QR codes.</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack.Screen
            options={{
              headerTitleAlign: 'center',
              headerTitle: ScanQrHeaderTitle,
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
            <ScreenTitle title="No Camera Access" className="text-center text-2xl font-normal" />
            <View style={{ marginBottom: 16 }} />
            <Text testID="form-subtitle" className="mb-3 text-center text-sm font-normal">
              Grimm App doesn't have access to the camera. Please enable camera access to scan QR codes.
            </Text>
            <View style={{ marginBottom: 16 }} />
            <Button
              testID="open-settings-button"
              label="Open Settings"
              variant="outline"
              className="mb-4"
              textClassName="text-base"
              onPress={async () => {
                await Linking.openURL('app-settings://GrimmApp');
              }}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen
          options={{
            headerTitleAlign: 'center',
            headerTitle: ScanQrHeaderTitle,
            headerShown: true,
            headerShadowVisible: false,
            headerLeft: HeaderLeft,
          }}
        />
        <FocusAwareStatusBar style="dark" />

        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing={facing}
            flash={flashEnabled ? 'on' : 'off'}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={isScanning ? handleQrCodeScanned : undefined}
          >
            {/* Overlay avec cadre de scan */}
            <View style={{ flex: 1, position: 'relative' }}>
              {/* Zone d'assombrissement autour du cadre */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
              />

              {/* Zone transparente pour le scan */}
              <View
                style={{
                  position: 'absolute',
                  top: (screenHeight - SCAN_FRAME_SIZE) / 2 - 100,
                  left: (screenWidth - SCAN_FRAME_SIZE) / 2,
                  width: SCAN_FRAME_SIZE,
                  height: SCAN_FRAME_SIZE,
                  backgroundColor: 'transparent',
                  borderRadius: 12,
                }}
              />

              {/* Cadre de scan */}
              <ScanFrame />

              {/* Instructions */}
              <View
                style={{
                  position: 'absolute',
                  top: (screenHeight - SCAN_FRAME_SIZE) / 2 - 180,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}
              >
                <Text className="text-center text-xl font-normal text-gray-300">Position the QR Code in view to activate</Text>
                <Text className="my-6 text-center text-sm font-normal text-gray-300">{isScanning ? 'Scanning...' : 'Processing...'}</Text>
              </View>

              <View
                style={{
                  position: 'absolute',
                  bottom: 80,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  paddingHorizontal: 60,
                }}
              >
                <TouchableOpacity
                  onPress={toggleCameraFacing}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 30,
                    padding: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleFlash}
                  style={{
                    backgroundColor: flashEnabled ? colors.primary[600] : 'rgba(255,255,255,0.2)',
                    borderRadius: 30,
                    padding: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={flashEnabled ? 'flash' : 'flash-off'} size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleClose}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 30,
                    padding: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
