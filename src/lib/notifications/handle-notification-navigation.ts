import type { NotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';

/**
 * Post-tap: open wallet home only.
 * The `data` payload is not used for navigation.
 */
export function handleNotificationNavigation(_response: NotificationResponse): void {
  console.warn('[notifications] Notification tap — opening home /(app)');
  router.push('/(app)');
}
