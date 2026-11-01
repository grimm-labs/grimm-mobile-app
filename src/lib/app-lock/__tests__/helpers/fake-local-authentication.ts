/**
 * Controllable expo-local-authentication for the App Lock tests: the enrolled level, the result of authenticateAsync,
 * and the recorded options (authenticateAsync.mock.calls).
 * Use: jest.mock('expo-local-authentication', () => require('@/lib/app-lock/__tests__/helpers/fake-local-authentication'));
 */

// Same values as the real module (LocalAuthentication.types.ts)
export enum SecurityLevel {
  NONE = 0,
  SECRET = 1,
  BIOMETRIC_WEAK = 2,
  BIOMETRIC_STRONG = 3,
}

export enum AuthenticationType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3,
}

type AuthenticationResult = { success: true } | { success: false; error: string };

type FakeState = {
  enrolledLevel: SecurityLevel;
  authenticationTypes: AuthenticationType[];
  result: AuthenticationResult;
};

const defaults = (): FakeState => ({
  enrolledLevel: SecurityLevel.SECRET,
  authenticationTypes: [],
  result: { success: false, error: 'user_cancel' },
});

let state = defaults();

export const hasHardwareAsync = jest.fn(async () => state.authenticationTypes.length > 0);
export const isEnrolledAsync = jest.fn(async () => state.enrolledLevel >= SecurityLevel.BIOMETRIC_WEAK);
export const supportedAuthenticationTypesAsync = jest.fn(async () => state.authenticationTypes);
export const getEnrolledLevelAsync = jest.fn(async () => state.enrolledLevel);
export const authenticateAsync = jest.fn(async (_options?: Record<string, unknown>) => state.result);

export const fakeLocalAuthentication = {
  /** Back to a phone with a screen lock (Device Passcode) and no biometrics; every prompt is cancelled. */
  reset() {
    state = defaults();
    [hasHardwareAsync, isEnrolledAsync, supportedAuthenticationTypesAsync, getEnrolledLevelAsync, authenticateAsync].forEach((fn) => fn.mockClear());
  },
  /** Android Class 3 fingerprint, or Face ID / Touch ID on iOS (the native module reports both as BIOMETRIC_STRONG). */
  enrollStrongBiometrics(type: AuthenticationType = AuthenticationType.FINGERPRINT) {
    state.enrolledLevel = SecurityLevel.BIOMETRIC_STRONG;
    state.authenticationTypes = [type];
  },
  /** Many 2D face unlocks on Android. */
  enrollWeakBiometrics() {
    state.enrolledLevel = SecurityLevel.BIOMETRIC_WEAK;
    state.authenticationTypes = [AuthenticationType.FACIAL_RECOGNITION];
  },
  /** The user removed their biometrics from the phone: only the Device Passcode is left. */
  removeBiometrics() {
    state.enrolledLevel = SecurityLevel.SECRET;
    state.authenticationTypes = [];
  },
  /** A phone without any screen lock. */
  removeScreenLock() {
    state.enrolledLevel = SecurityLevel.NONE;
    state.authenticationTypes = [];
  },
  willSucceed() {
    state.result = { success: true };
  },
  willFail(error = 'authentication_failed') {
    state.result = { success: false, error };
  },
  willCancel() {
    state.result = { success: false, error: 'user_cancel' };
  },
  clearPromptHistory() {
    authenticateAsync.mockClear();
  },
  /** The options of every authenticateAsync call, in order. */
  promptOptions: () => authenticateAsync.mock.calls.map(([options]) => options),
};
