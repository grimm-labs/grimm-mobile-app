import type { NotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { handleNotificationNavigation } from '../handle-notification-navigation';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

function makeResponse(data?: unknown): NotificationResponse {
  return {
    notification: {
      request: {
        content: {
          title: null,
          subtitle: null,
          body: null,
          data: (data ?? {}) as Record<string, unknown>,
          categoryIdentifier: null,
          sound: null,
        },
        identifier: 'test-id',
        trigger: { type: 'push' } as never,
      },
      date: Date.now(),
    },
    actionIdentifier: 'default',
  } as unknown as NotificationResponse;
}

describe('handleNotificationNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to /(app) on tap', () => {
    handleNotificationNavigation(makeResponse());
    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('navigates to /(app) regardless of data.screen', () => {
    handleNotificationNavigation(makeResponse({ screen: 'transaction-details/onchain' }));
    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('does not call Linking.openURL even when data.url is present', () => {
    handleNotificationNavigation(makeResponse({ url: 'https://grimm.app' }));
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('does not crash when data is null', () => {
    expect(() => handleNotificationNavigation(makeResponse(null))).not.toThrow();
    expect(router.push).toHaveBeenCalledWith('/(app)');
  });

  it('does not crash when data contains legacy transactionData', () => {
    handleNotificationNavigation(makeResponse({
      screen: 'transaction-details/ln',
      params: { transactionData: '{"paymentType":"Receive","amountSat":50000}' },
    }));
    expect(router.push).toHaveBeenCalledWith('/(app)');
  });
});
