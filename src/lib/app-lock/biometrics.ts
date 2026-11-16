import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

type PromptMessages = { promptMessage: string; cancelLabel: string };

const getEnrolledLevel = async () => {
  try {
    return await LocalAuthentication.getEnrolledLevelAsync();
  } catch {
    return LocalAuthentication.SecurityLevel.NONE;
  }
};

/**
 * Strong biometrics only: Class 3 on Android. iOS reports Face ID and Touch ID as BIOMETRIC_STRONG.
 * Weak biometrics (many 2D face unlocks) do not count.
 */
export const isBiometricUnlockAvailable = async () => (await getEnrolledLevel()) === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG;

/** False when the phone has neither a Device Passcode nor biometrics. */
export const hasScreenLock = async () => (await getEnrolledLevel()) !== LocalAuthentication.SecurityLevel.NONE;

const authenticate = async (options: LocalAuthentication.LocalAuthenticationOptions) => {
  try {
    return (await LocalAuthentication.authenticateAsync(options)).success;
  } catch {
    return false;
  }
};

/** Biometric Unlock never falls back to the Device Passcode. */
export const promptBiometricUnlock = (messages: PromptMessages) => authenticate({ ...messages, disableDeviceFallback: true, biometricsSecurityLevel: 'strong' });

/**
 * androidx.biometric refuses strong biometrics + Device Passcode on Android 9 and 10 (API 28-29): building that prompt
 * throws, and expo-local-authentication does not catch it. Only weak biometrics + Device Passcode is allowed there.
 */
const isStrongWithPasscodeUnsupported = () => Platform.OS === 'android' && (Platform.Version === 28 || Platform.Version === 29);

/**
 * The phone's own authentication, used for the Recovery Phrase when App Lock is off: strong biometrics or the Device
 * Passcode. On Android 9 and 10 any enrolled biometric counts, the only combination with the Device Passcode there.
 */
export const promptPhoneAuthentication = (messages: PromptMessages) => authenticate({ ...messages, disableDeviceFallback: false, biometricsSecurityLevel: isStrongWithPasscodeUnsupported() ? 'weak' : 'strong' });
