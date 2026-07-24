import { useEffect, useRef } from 'react';

import { logRegistrationFailed } from '@/lib/notifications/logger';
import { registerDeviceWithNotificationService } from '@/lib/notifications/register-device';

type UseRegisterDeviceOptions = {
  autoRegister?: boolean;
  enabled?: boolean;
};

export function useRegisterDevice(options: UseRegisterDeviceOptions = {}) {
  const { autoRegister = false, enabled = true } = options;
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!autoRegister || !enabled || hasAttempted.current) return;

    hasAttempted.current = true;

    registerDeviceWithNotificationService({ requestPermission: true }).catch((error) => {
      logRegistrationFailed(error instanceof Error ? error.message : String(error));
    });
  }, [autoRegister, enabled]);
}
