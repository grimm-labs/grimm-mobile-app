import * as Linking from 'expo-linking';
import type { NotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';

import { ALLOWED_SCREENS, type AllowedScreen, parseNotificationData } from './notification-data.schema';

export function handleNotificationNavigation(response: NotificationResponse): void {
  const rawData = response.notification.request.content.data;
  const data = parseNotificationData(rawData);

  if (!data) {
    router.push('/(app)');
    return;
  }

  if (data.url) {
    Linking.openURL(data.url).catch(() => {
      router.push('/(app)');
    });
    return;
  }

  if (!data.screen || !isAllowedScreen(data.screen)) {
    console.warn('[notifications] Écran inconnu:', data.screen);
    router.push('/(app)');
    return;
  }

  navigateToScreen(data.screen, data.params ?? {});
}

function isAllowedScreen(screen: string): screen is AllowedScreen {
  return (ALLOWED_SCREENS as readonly string[]).includes(screen);
}

function navigateToScreen(screen: AllowedScreen, params: Record<string, string>): void {
  if (screen === '(app)') {
    router.push('/(app)');
    return;
  }

  router.push({
    pathname: `/${screen}` as `/${AllowedScreen}`,
    params,
  });
}
