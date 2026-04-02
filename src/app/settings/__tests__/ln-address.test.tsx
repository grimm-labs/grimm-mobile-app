import React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

// Native module mocks (must be before component import)
jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  PaymentStatus: { Completed: 'completed' },
  PaymentType: { Receive: 'receive' },
}));

jest.mock('bdk-rn', () => ({
  Mnemonic: jest.fn(),
}));

jest.mock('@/api', () => ({
  supportedBitcoinCurrencies: [],
}));

import LnAddressScreen from '../ln-address';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props: Record<string, unknown>) => <Text>{String(props.name)}</Text>;
});

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };
});

jest.mock('react-native-flash-message', () => ({
  showMessage: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

const mockCheckAvailable = jest.fn();
const mockRegister = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/lib/context/breez-context', () => ({
  useBreez: () => ({
    lightningAddress: mockLightningAddress,
    checkLightningAddressAvailable: mockCheckAvailable,
    registerLightningAddress: mockRegister,
    deleteLightningAddress: mockDelete,
  }),
}));

jest.mock('@/components/ui/modal', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    useModal: () => ({
      ref: React.createRef(),
      present: mockPresent,
      dismiss: mockDismiss,
    }),
    Modal: ({ children }: { children: React.ReactNode }) => <View testID="modal">{children}</View>,
  };
});

let mockLightningAddress: string | null = null;

afterEach(() => {
  cleanup();
  mockLightningAddress = null;
  jest.clearAllMocks();
});

describe('LnAddressScreen', () => {
  describe('empty state (no address)', () => {
    it('renders empty state UI when no lightning address exists', () => {
      mockLightningAddress = null;
      setup(<LnAddressScreen />);

      expect(screen.getByText('lnAddressSettings.emptyState.title')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.emptyState.subtitle')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.emptyState.cta')).toBeOnTheScreen();
    });

    it('switches to create mode when CTA is pressed', async () => {
      mockLightningAddress = null;
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.emptyState.cta'));

      expect(screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.create.generateRandom')).toBeOnTheScreen();
    });
  });

  describe('address view (existing address)', () => {
    beforeEach(() => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
    });

    it('renders the current address', () => {
      setup(<LnAddressScreen />);

      expect(screen.getByText('lnAddressSettings.currentAddress')).toBeOnTheScreen();
      expect(screen.getByText('satoshi@pay.usegrimm.app')).toBeOnTheScreen();
    });

    it('renders edit and delete buttons', () => {
      setup(<LnAddressScreen />);

      expect(screen.getByText('lnAddressSettings.edit.headerTitle')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.delete.button')).toBeOnTheScreen();
    });

    it('copies address to clipboard when pressed', async () => {
      const Clipboard = require('expo-clipboard');
      const { showMessage } = require('react-native-flash-message');
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('satoshi@pay.usegrimm.app'));

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('satoshi@pay.usegrimm.app');
      await waitFor(() => {
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.copiedToClipboard', type: 'success' }));
      });
    });

    it('switches to edit mode when edit button is pressed', async () => {
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.edit.headerTitle'));

      // In edit mode, the input should be pre-filled with existing username
      expect(screen.getByDisplayValue('satoshi')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.edit.save')).toBeOnTheScreen();
    });

    it('opens delete modal when delete button is pressed', async () => {
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.delete.button'));

      expect(mockPresent).toHaveBeenCalled();
    });
  });

  describe('create form', () => {
    beforeEach(() => {
      mockLightningAddress = null;
    });

    const goToCreateMode = async () => {
      const result = setup(<LnAddressScreen />);
      await result.user.press(screen.getByText('lnAddressSettings.emptyState.cta'));
      return result;
    };

    it('shows the create form with input and generate random button', async () => {
      await goToCreateMode();

      expect(screen.getByText('lnAddressSettings.create.generateRandom')).toBeOnTheScreen();
      expect(screen.getAllByText('lnAddressSettings.confirm.confirmButton').length).toBeGreaterThanOrEqual(1);
    });

    it('shows domain suffix in the input', async () => {
      await goToCreateMode();

      expect(screen.getByText('@pay.usegrimm.app')).toBeOnTheScreen();
    });

    it('updates username on text change', async () => {
      const { user } = await goToCreateMode();

      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'testuser');

      expect(screen.getByDisplayValue('testuser')).toBeOnTheScreen();
    });

    it('generates a random username when generate button is pressed', async () => {
      const { user } = await goToCreateMode();

      await user.press(screen.getByText('lnAddressSettings.create.generateRandom'));

      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      expect(input.props.value).toMatch(/^[a-z]+-[a-z]+-\d{1,3}$/);
    });

    it('checks availability and opens confirm modal on submit', async () => {
      mockCheckAvailable.mockResolvedValue(true);
      const { user } = await goToCreateMode();

      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'myname');
      // First confirmButton is the form submit button
      await user.press(screen.getAllByText('lnAddressSettings.confirm.confirmButton')[0]);

      await waitFor(() => {
        expect(mockCheckAvailable).toHaveBeenCalledWith('myname');
        expect(mockPresent).toHaveBeenCalled();
      });
    });

    it('shows taken error when username is not available', async () => {
      mockCheckAvailable.mockResolvedValue(false);
      const { user } = await goToCreateMode();

      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'taken-name');
      await user.press(screen.getAllByText('lnAddressSettings.confirm.confirmButton')[0]);

      await waitFor(() => {
        expect(screen.getByText('lnAddressSettings.create.taken')).toBeOnTheScreen();
      });
    });

    it('shows error message when availability check fails', async () => {
      const { showMessage } = require('react-native-flash-message');
      mockCheckAvailable.mockRejectedValue(new Error('network'));
      const { user } = await goToCreateMode();

      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'myname');
      await user.press(screen.getAllByText('lnAddressSettings.confirm.confirmButton')[0]);

      await waitFor(() => {
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.errors.checkFailed', type: 'danger' }));
      });
    });

    it('does not submit when username is too short', async () => {
      const { user } = await goToCreateMode();

      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'a');
      await user.press(screen.getAllByText('lnAddressSettings.confirm.confirmButton')[0]);

      expect(mockCheckAvailable).not.toHaveBeenCalled();
    });
  });

  describe('confirm create flow', () => {
    it('registers address and shows success on confirm', async () => {
      mockLightningAddress = null;
      mockCheckAvailable.mockResolvedValue(true);
      mockRegister.mockResolvedValue(undefined);
      const { showMessage } = require('react-native-flash-message');

      const { user } = setup(<LnAddressScreen />);

      // Go to create mode
      await user.press(screen.getByText('lnAddressSettings.emptyState.cta'));

      // Type username
      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'myname');

      // Submit → opens confirm modal (first confirmButton = form submit)
      await user.press(screen.getAllByText('lnAddressSettings.confirm.confirmButton')[0]);
      await waitFor(() => expect(mockPresent).toHaveBeenCalled());

      // Press confirm in the modal (last confirmButton = modal confirm)
      const confirmButtons = screen.getAllByText('lnAddressSettings.confirm.confirmButton');
      await user.press(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('myname');
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.success.created', type: 'success' }));
      });
    });

    it('shows error when registration fails', async () => {
      mockLightningAddress = null;
      mockCheckAvailable.mockResolvedValue(true);
      mockRegister.mockRejectedValue(new Error('fail'));
      const { showMessage } = require('react-native-flash-message');

      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.emptyState.cta'));
      const input = screen.getByPlaceholderText('lnAddressSettings.create.usernamePlaceholder');
      await user.type(input, 'myname');
      await user.press(screen.getAllByText('lnAddressSettings.confirm.confirmButton')[0]);
      await waitFor(() => expect(mockPresent).toHaveBeenCalled());

      const confirmButtons = screen.getAllByText('lnAddressSettings.confirm.confirmButton');
      await user.press(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.errors.createFailed', type: 'danger' }));
      });
    });

    it('dismisses modal when cancel is pressed', async () => {
      mockLightningAddress = null;
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.emptyState.cta'));

      // Cancel button in confirm modal is always rendered
      await user.press(screen.getByText('lnAddressSettings.confirm.cancelButton'));

      expect(mockDismiss).toHaveBeenCalled();
    });
  });

  describe('delete flow', () => {
    beforeEach(() => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
    });

    it('deletes address and shows success message', async () => {
      mockDelete.mockResolvedValue(undefined);
      const { showMessage } = require('react-native-flash-message');
      const { user } = setup(<LnAddressScreen />);

      // Press delete confirm button inside the delete modal (always rendered)
      await user.press(screen.getByText('lnAddressSettings.delete.confirmButton'));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.success.deleted', type: 'success' }));
      });
    });

    it('shows error when delete fails', async () => {
      mockDelete.mockRejectedValue(new Error('fail'));
      const { showMessage } = require('react-native-flash-message');
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.delete.confirmButton'));

      await waitFor(() => {
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.errors.deleteFailed', type: 'danger' }));
      });
    });

    it('dismisses delete modal when cancel is pressed', async () => {
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.delete.cancelButton'));

      expect(mockDismiss).toHaveBeenCalled();
    });

    it('renders delete modal title and message', () => {
      setup(<LnAddressScreen />);

      expect(screen.getByText('lnAddressSettings.delete.title')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.delete.message')).toBeOnTheScreen();
    });
  });

  describe('edit flow', () => {
    beforeEach(() => {
      mockLightningAddress = 'satoshi@pay.usegrimm.app';
    });

    it('pre-fills username in edit mode', async () => {
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.edit.headerTitle'));

      expect(screen.getByDisplayValue('satoshi')).toBeOnTheScreen();
    });

    it('shows save button in edit mode', async () => {
      const { user } = setup(<LnAddressScreen />);

      await user.press(screen.getByText('lnAddressSettings.edit.headerTitle'));

      expect(screen.getByText('lnAddressSettings.edit.save')).toBeOnTheScreen();
    });

    it('registers updated address and shows updated message', async () => {
      mockCheckAvailable.mockResolvedValue(true);
      mockRegister.mockResolvedValue(undefined);
      const { showMessage } = require('react-native-flash-message');
      const { user } = setup(<LnAddressScreen />);

      // Enter edit mode
      await user.press(screen.getByText('lnAddressSettings.edit.headerTitle'));

      // Clear and type new username
      const input = screen.getByDisplayValue('satoshi');
      await user.clear(input);
      await user.type(input, 'newname');

      // Submit
      await user.press(screen.getByText('lnAddressSettings.edit.save'));
      await waitFor(() => expect(mockPresent).toHaveBeenCalled());

      // Confirm in modal
      const confirmButtons = screen.getAllByText('lnAddressSettings.confirm.confirmButton');
      await user.press(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('newname');
        expect(showMessage).toHaveBeenCalledWith(expect.objectContaining({ message: 'lnAddressSettings.success.updated', type: 'success' }));
      });
    });

    it('can submit edit and confirms in modal', async () => {
      mockCheckAvailable.mockResolvedValue(true);
      mockRegister.mockResolvedValue(undefined);
      const { user } = setup(<LnAddressScreen />);

      // Enter edit mode
      await user.press(screen.getByText('lnAddressSettings.edit.headerTitle'));

      // Submit (save button)
      await user.press(screen.getByText('lnAddressSettings.edit.save'));

      await waitFor(() => {
        expect(mockCheckAvailable).toHaveBeenCalledWith('satoshi');
        expect(mockPresent).toHaveBeenCalled();
      });
    });
  });

  describe('confirm modal content', () => {
    it('renders confirm modal title and message', () => {
      mockLightningAddress = null;
      setup(<LnAddressScreen />);

      expect(screen.getByText('lnAddressSettings.confirm.title')).toBeOnTheScreen();
      expect(screen.getByText('lnAddressSettings.confirm.message')).toBeOnTheScreen();
    });
  });
});
