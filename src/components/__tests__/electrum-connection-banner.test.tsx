import React from 'react';

import { ElectrumConnectionBanner } from '@/components/electrum-connection-banner';
import { cleanup, screen, setup } from '@/lib/test-utils';

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({ t: (key: string) => key }),
}));

let mockError: string | null = null;
let mockIsSyncing = false;

jest.mock('@/lib/context', () => ({
  useBdk: () => ({
    error: mockError,
    isSyncing: mockIsSyncing,
  }),
}));

describe('ElectrumConnectionBanner', () => {
  afterEach(() => {
    cleanup();
    mockError = null;
    mockIsSyncing = false;
  });

  it('shows banner when error is set and not syncing', () => {
    mockError = 'Connection failed';
    mockIsSyncing = false;
    setup(<ElectrumConnectionBanner />);

    expect(screen.getByText('home.electrumConnectionWarning')).toBeOnTheScreen();
  });

  it('does not show banner when error is null', () => {
    mockError = null;
    mockIsSyncing = false;
    setup(<ElectrumConnectionBanner />);

    expect(screen.queryByText('home.electrumConnectionWarning')).not.toBeOnTheScreen();
  });

  it('does not show banner when syncing even if error is set', () => {
    mockError = 'Connection failed';
    mockIsSyncing = true;
    setup(<ElectrumConnectionBanner />);

    expect(screen.queryByText('home.electrumConnectionWarning')).not.toBeOnTheScreen();
  });
});
