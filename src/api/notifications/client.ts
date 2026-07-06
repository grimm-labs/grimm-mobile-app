import { Env } from '@env';
import axios from 'axios';

const DEFAULT_TIMEOUT = 10_000;

export const notificationClient = axios.create({
  baseURL: Env.NOTIFICATION_API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export function assertNotificationServiceConfigured(): void {
  if (!Env.NOTIFICATION_API_URL) {
    throw new Error('[notifications] NOTIFICATION_API_URL is not configured');
  }
}
