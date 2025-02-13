/* eslint-disable max-lines-per-function */
import type { CameraType } from 'expo-camera';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenSubtitle } from '@/components/screen-subtitle';
import { ScreenTitle } from '@/components/screen-title';
import { Button, FocusAwareStatusBar } from '@/ui';

export default function ScanQrScreen() {
  // Permission caméra
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [_permission, _requestPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const checkCameraPermission = async () => {
    const permissionResponse = await Camera.requestCameraPermissionsAsync();
    setHasPermission(permissionResponse.granted);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
    <SafeAreaView>
      <View className="flex h-full justify-between">
        <Stack.Screen
          options={{
            title: 'Scan QR',
            headerShown: true,
            headerShadowVisible: false,
            headerBackTitleVisible: false,
          }}
        />
        <FocusAwareStatusBar />
        <View className="border">
          <CameraView facing={facing} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}>
            <View className="h-full">
              <TouchableOpacity onPress={toggleCameraFacing}>
                <Text className="text-white">Flip Camera</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </View>
    </SafeAreaView>
  );

  // const [hasPermission, setHasPermission] = useState(null);

  // // État du flash
  // const [flash, setFlash] = useState(false);

  // // Éviter de scanner plusieurs fois d'affilée
  // const [scanned, setScanned] = useState(false);

  // // Navigation via expo-router
  // const router = useRouter();

  // // Demande de permission à l'ouverture
  // useEffect(() => {
  //   (async () => {
  //     const { status } = await Camera.requestCameraPermissionsAsync();
  //     setHasPermission(status === PermissionStatus);
  //   })();
  // }, []);

  // // Fonction déclenchée au scan
  // const handleBarCodeScanned = ({ type, data }) => {
  //   if (!scanned) {
  //     setScanned(true);
  //     console.log('Type : ', type);
  //     console.log('Data : ', data);

  //     // Redirection vers une autre page
  //     router.push({
  //       pathname: '/someOtherScreen',
  //       params: { qrData: data },
  //     });
  //   }
  // };

  // // Affichage en attente de décision
  // if (hasPermission === null) {
  //   return (
  //     <SafeAreaView className="flex-1 items-center justify-center bg-white">
  //       <Text className="text-base text-gray-700">Demande de permission...</Text>
  //     </SafeAreaView>
  //   );
  // }

  // // Si refus
  // if (hasPermission === false) {
  //   return (
  //     <SafeAreaView className="flex-1 items-center justify-center bg-white px-5">
  //       <Text className="mb-2 text-center text-lg text-red-600">Vous avez refusé la permission d'utiliser la caméra.</Text>
  //       <Text className="text-center text-base text-gray-700">Vous pouvez l'activer dans les paramètres pour scanner un QR code.</Text>
  //     </SafeAreaView>
  //   );
  // }

  // // Sinon on affiche la caméra
  // return (
  //   <SafeAreaView className="relative flex-1 bg-black">
  //     {/* Barre du haut (boutons) */}
  //     <View className="absolute top-0 z-10 w-full flex-row justify-between bg-black/50 px-4 py-2">
  //       {/* Bouton fermer */}
  //       <TouchableOpacity onPress={() => router.back()}>
  //         <Ionicons name="close" size={30} color="#fff" />
  //       </TouchableOpacity>

  //       {/* Bouton flash */}
  //       <TouchableOpacity onPress={() => setFlash(!flash)}>
  //         <Ionicons name={flash ? 'flash' : 'flash-off'} size={30} color="#fff" />
  //       </TouchableOpacity>
  //     </View>

  //     {/* Composant Caméra */}
  //     <Camera
  //       className="flex-1 justify-end"
  //       type={CameraType.back}
  //       flashMode={flash ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
  //       barCodeScannerSettings={{
  //         barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
  //       }}
  //       onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
  //     >
  //       {/* Overlay + zone de scan */}
  //       <View className="absolute inset-0 flex items-center justify-center">
  //         <View className="h-64 w-64 rounded-md border-2 border-green-500 bg-transparent" />
  //       </View>
  //     </Camera>
  //   </SafeAreaView>
  // );
}
