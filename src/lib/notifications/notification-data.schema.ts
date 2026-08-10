export interface NotificationData {
  screen?: string;
  params?: Record<string, string>;
  url?: string;
  campaignId?: string;
}

export const ALLOWED_SCREENS = ['settings', 'transaction-details/ln', 'transaction-details/onchain', '(app)'] as const;

export type AllowedScreen = (typeof ALLOWED_SCREENS)[number];

export function parseNotificationData(raw: unknown): NotificationData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  return {
    screen: typeof data.screen === 'string' ? data.screen : undefined,
    params: sanitizeParams(data.params),
    url: typeof data.url === 'string' ? data.url : undefined,
    campaignId: typeof data.campaignId === 'string' ? data.campaignId : undefined,
  };
}

function sanitizeParams(params: unknown): Record<string, string> | undefined {
  if (!params || typeof params !== 'object') return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (typeof value === 'string') result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
