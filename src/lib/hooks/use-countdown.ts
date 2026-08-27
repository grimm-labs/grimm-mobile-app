import { useEffect, useState } from 'react';

/**
 * Formats a remaining duration (in seconds) as `h:mm:ss` when at least one hour remains, otherwise `m:ss`.
 * Negative or fractional inputs are clamped/floored to whole seconds.
 */
export const formatRemainingTime = (remainingSecs: number): string => {
  const total = Math.max(0, Math.floor(remainingSecs));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
};

/**
 * Ticks every second until `expiresAt` (epoch milliseconds) is reached.
 * Returns `remainingSecs: null` when no deadline is set.
 */
export const useCountdown = (expiresAt: number | null) => {
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);

  useEffect(() => {
    if (expiresAt === null) {
      setRemainingSecs(null);
      return;
    }

    const tick = () => setRemainingSecs(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return { remainingSecs, isExpired: remainingSecs !== null && remainingSecs <= 0 };
};
