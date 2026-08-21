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
  const validEntries = Object.entries(params as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[0] !== '__proto__' && entry[0] !== 'constructor');
  return validEntries.length > 0 ? Object.fromEntries(validEntries) : undefined;
}
