// src/lib/hooks/use-register-device.ts
import { useCallback, useEffect, useRef, useState } from 'react';

import { registerDeviceWithNotificationService } from '@/lib/notifications/register-device';

type UseRegisterDeviceOptions = {
  autoRegister?: boolean;
  enabled?: boolean;
};

export function useRegisterDevice(options: UseRegisterDeviceOptions = {}) {
  const { autoRegister = false, enabled = true } = options;
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasAttempted = useRef(false);

  const register = useCallback(async () => {
    if (!enabled) return null;

    setIsRegistering(true);
    setError(null);

    try {
      const result = await registerDeviceWithNotificationService();
      setIsRegistered(result !== null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.warn('[notifications] Device registration failed:', error.message);
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (autoRegister && enabled && !hasAttempted.current) {
      hasAttempted.current = true;
      register();
    }
  }, [autoRegister, enabled, register]);

  return { register, isRegistering, isRegistered, error };
}
