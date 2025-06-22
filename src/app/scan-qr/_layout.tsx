/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import type { CameraType } from 'expo-camera';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { ScreenTitle } from '@/components/screen-title';
import { Button, colors, FocusAwareStatusBar, SafeAreaView, Text, TouchableOpacity, View } from '@/components/ui';

const ScanQrHeaderTitle = () => <HeaderTitle title="Scan QR" />;

// Dimensions de l'écran
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Taille du cadre de scan (carré)
const SCAN_FRAME_SIZE = screenWidth * 0.7;

export default function ScanQrScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [_permission, _requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);

  // Ref pour éviter les scans multiples
  const scanTimeoutRef = useRef<number | null>(null);

  const checkCameraPermission = async () => {
    const permissionResponse = await Camera.requestCameraPermissionsAsync();
    setHasPermission(permissionResponse.granted);
  };

  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Fonction appelée lors de la détection d'un QR code
  const handleQrCodeScanned = useCallback(
    ({ type, data }: { type: string; data: string }) => {
      if (!isScanning) return;

      // Désactiver temporairement le scan pour éviter les détections multiples
      setIsScanning(false);

      // Annuler le timeout précédent s'il existe
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      console.log('QR Code détecté:', { type, data });

      // Ici vous pouvez implémenter votre logique personnalisée
      handleQrCodeDetected(data);

      // Réactiver le scan après 2 secondes
      scanTimeoutRef.current = setTimeout(() => {
        setIsScanning(true);
      }, 2000);
    },
    [isScanning],
  );

  // Fonction à personnaliser selon vos besoins
  const handleQrCodeDetected = (qrData: string) => {
    // Exemple de logique :
    // - Validation du QR code
    // - Navigation vers un autre écran
    // - Appel API
    // - Affichage d'une alerte

    console.log('Traitement des données QR:', qrData);

    // Exemple : si c'est une URL, l'ouvrir
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      Linking.openURL(qrData);
    }

    // Vous pouvez ajouter d'autres conditions selon vos besoins
    // Par exemple : navigation, validation, etc.
  };

  // Nettoyage du timeout au démontage du composant
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

  // Composant pour le cadre de scan
  const ScanFrame = () => (
    <View
      style={{
        position: 'absolute',
        top: (screenHeight - SCAN_FRAME_SIZE) / 2 - 100, // Ajustement pour centrer
        left: (screenWidth - SCAN_FRAME_SIZE) / 2,
        width: SCAN_FRAME_SIZE,
        height: SCAN_FRAME_SIZE,
        backgroundColor: 'transparent',
      }}
    >
      {/* Coins du cadre */}
      <View style={{ position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.primary[600], borderRadius: 8 }} />
      <View style={{ position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.primary[600], borderRadius: 8 }} />
      <View style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.primary[600], borderRadius: 8 }} />
      <View style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.primary[600], borderRadius: 8 }} />
    </View>
  );

  if (!hasPermission) {
    return (
      <SafeAreaProvider>
        <SafeAreaView>
          <View className="flex h-full justify-between px-4">
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
            <View className="flex-1 items-center justify-center">
              <ScreenTitle title="No Camera Access" className="text-center text-2xl font-normal" />
              <View className="mb-4" />
              <Text testID="form-subtitle" className="mb-3 text-center text-sm font-normal">
                Grimm App doesn't have access to the camera. Please enable camera access to scan QR codes.
              </Text>
              <View className="mb-4" />
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
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <View className="flex h-full">
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

          <View className="relative flex-1">
            <CameraView
              className="flex-1"
              facing={facing}
              flash={flashEnabled ? 'on' : 'off'}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isScanning ? handleQrCodeScanned : undefined}
            >
              {/* Overlay avec cadre de scan */}
              <View style={{ flex: 1 }}>
                {/* Zone transparente pour le scan */}
                <View
                  style={{
                    position: 'absolute',
                    top: (screenHeight - SCAN_FRAME_SIZE) / 2 - 100,
                    left: (screenWidth - SCAN_FRAME_SIZE) / 2,
                    width: SCAN_FRAME_SIZE,
                    height: SCAN_FRAME_SIZE,
                    backgroundColor: 'transparent',
                  }}
                />

                {/* Cadre de scan */}
                <ScanFrame />

                {/* Instructions */}
                <View style={{ position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center' }}>
                  <Text className="px-4 text-center text-lg font-medium text-black">Placez le QR code dans le cadre</Text>
                  <Text className="mt-2 px-4 text-center text-sm text-black">{isScanning ? 'Scan en cours...' : 'Traitement...'}</Text>
                </View>

                {/* Bouton flash en bas */}
                <TouchableOpacity
                  onPress={toggleFlash}
                  style={{
                    position: 'absolute',
                    bottom: 100,
                    left: (screenWidth - 60) / 2,
                    backgroundColor: flashEnabled ? 'rgba(255,255,0,0.8)' : 'rgba(0,0,0,0.6)',
                    borderRadius: 30,
                    padding: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={flashEnabled ? 'flash' : 'flash-off'} size={30} color={flashEnabled ? 'black' : 'white'} />
                </TouchableOpacity>
                {/* Bouton flip camera en haut à droite */}
                <TouchableOpacity onPress={toggleCameraFacing}>
                  <Ionicons name="camera-reverse" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
