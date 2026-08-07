import * as Notifications from 'expo-notifications';

let handlerConfigured = false;

export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
export function handleNotificationTap(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data;
  if (__DEV__) {
    console.log('[notifications] Tapped:', data);
  }
  // M009 : router.push(screen, params) avec allowlist
}
import { Platform } from 'react-native';

export async function configureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Grimm Wallet',
    description: 'Alertes portefeuille et mises à jour',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F7931A',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync('transactions', {
    name: 'Transactions',
    description: 'Alertes transactions entrantes et sortantes',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

type NotificationTapHandler = (response: Notifications.NotificationResponse) => void;

export function registerPushListeners(onNotificationReceived?: (notification: Notifications.Notification) => void, onNotificationTapped?: NotificationTapHandler, options?: { manageBadge?: boolean }): () => void {
  const manageBadge = options?.manageBadge ?? true;

  const receivedSub = Notifications.addNotificationReceivedListener(async (notification) => {
    if (manageBadge) {
      try {
        const current = await Notifications.getBadgeCountAsync();
        await Notifications.setBadgeCountAsync(current + 1);
      } catch {
        // simulateur iOS peut échouer
      }
    }
    onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationTapped?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
