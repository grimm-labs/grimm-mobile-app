import { Env } from 'env';

export const isNotificationServiceConfigured = (): boolean => {
  return Boolean(Env.NOTIFICATION_API_URL);
};
