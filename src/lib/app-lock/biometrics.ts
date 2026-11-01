import * as LocalAuthentication from 'expo-local-authentication';

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

/** The phone's own authentication, used for the Recovery Phrase when App Lock is off: strong biometrics or the Device Passcode. */
export const promptPhoneAuthentication = (messages: PromptMessages) => authenticate({ ...messages, disableDeviceFallback: false, biometricsSecurityLevel: 'strong' });
