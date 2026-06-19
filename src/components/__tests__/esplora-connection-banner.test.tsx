import React from 'react';

import { EsploraConnectionBanner } from '@/components/esplora-connection-banner';
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

describe('EsploraConnectionBanner', () => {
  afterEach(() => {
    cleanup();
    mockError = null;
    mockIsSyncing = false;
  });

  it('shows banner when error is set and not syncing', () => {
    mockError = 'Connection failed';
    mockIsSyncing = false;
    setup(<EsploraConnectionBanner />);

    expect(screen.getByText('home.esploraConnectionWarning')).toBeOnTheScreen();
  });

  it('does not show banner when error is null', () => {
    mockError = null;
    mockIsSyncing = false;
    setup(<EsploraConnectionBanner />);

    expect(screen.queryByText('home.esploraConnectionWarning')).not.toBeOnTheScreen();
  });

  it('does not show banner when syncing even if error is set', () => {
    mockError = 'Connection failed';
    mockIsSyncing = true;
    setup(<EsploraConnectionBanner />);

    expect(screen.queryByText('home.esploraConnectionWarning')).not.toBeOnTheScreen();
  });
});
