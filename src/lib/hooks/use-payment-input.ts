import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useBreez } from '@/lib/context/breez-context';
import { isValidAddress } from '@/lib/payment-input/address-network';
import type { PaymentInputDeps, PaymentInputError, PaymentInputRoute } from '@/lib/payment-input/route-payment-input';
import { routeLightningInput, routePaymentInput } from '@/lib/payment-input/route-payment-input';

type ChooseMethodRoute = Extract<PaymentInputRoute, { kind: 'chooseMethod' }>;

/** The screen a route leads to; null for the method sheet and the errors. */
function destinationOf(route: PaymentInputRoute): Href | null {
  switch (route.kind) {
    case 'lightningDetails':
      return { pathname: '/send/transaction-details', params: { rawInvoice: route.rawInvoice } };
    case 'lightningAmount':
      return { pathname: '/send/enter-amount', params: { paymentInput: route.paymentInput } };
    case 'onchainAmount':
      return {
        pathname: '/send-onchain/enter-amount',
        params: route.amountSats === undefined ? { recipientAddress: route.address } : { recipientAddress: route.address, amountSats: String(route.amountSats) },
      };
    case 'withdrawal':
      return { pathname: '/receive/withdrawal', params: { paymentInput: route.paymentInput } };
    default:
      return null;
  }
}

type UsePaymentInputOptions = {
  /** The scanner and the paste screens push the destination; /payment-input replaces itself with it. */
  navigation: 'push' | 'replace';
  /** Each entry point shows the error its own way (flash message, error screen). */
  onError: (reason: PaymentInputError) => void;
  /** The method sheet was closed without a choice. */
  onSheetDismiss?: () => void;
};

/**
 * Routes a Payment Input with the rules every entry point shares (src/lib/payment-input): navigates to the destination,
 * presents the method sheet for a Bitcoin URI with an Invoice, or reports the error. Render `methodSheet` with a
 * PaymentMethodBottomSheet in `send` mode. Not re-exported from `@/lib/hooks`: it pulls in the Breez context.
 */
export function usePaymentInput({ navigation, onError, onSheetDismiss }: UsePaymentInputOptions) {
  const router = useRouter();
  const { network, isBreezInitialized, parseInput } = useBreez();
  const sheetRef = useRef<BottomSheetModal>(null);
  const choiceRef = useRef<ChooseMethodRoute | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // The latest callbacks, so that routeInput keeps its identity when the screen re-renders
  const callbacksRef = useRef({ onError, onSheetDismiss });
  callbacksRef.current = { onError, onSheetDismiss };

  const deps = useMemo<PaymentInputDeps>(() => ({ network, isValidAddress, parse: isBreezInitialized ? parseInput : undefined }), [network, isBreezInitialized, parseInput]);

  const handleRoute = useCallback(
    (route: PaymentInputRoute) => {
      const destination = destinationOf(route);
      if (destination) {
        if (navigation === 'push') router.push(destination);
        else router.replace(destination);
      } else if (route.kind === 'chooseMethod') {
        choiceRef.current = route;
        setIsSheetOpen(true);
        sheetRef.current?.present();
      } else if (route.kind === 'error') {
        callbacksRef.current.onError(route.reason);
      }
    },
    [navigation, router],
  );

  const routeInput = useCallback(
    async (text: string) => {
      const route = await routePaymentInput(text, deps);
      handleRoute(route);
      return route;
    },
    [deps, handleRoute],
  );

  const onSelect = useCallback(
    async (method: 'lightning' | 'onchain') => {
      setIsSheetOpen(false);
      const choice = choiceRef.current;
      if (!choice) return;
      handleRoute(method === 'onchain' ? { kind: 'onchainAmount', ...choice.onchain } : await routeLightningInput(choice.lightning, deps));
    },
    [deps, handleRoute],
  );

  const onDismiss = useCallback(() => {
    setIsSheetOpen(false);
    callbacksRef.current.onSheetDismiss?.();
  }, []);

  return { routeInput, isSheetOpen, methodSheet: { ref: sheetRef, onSelect, onDismiss } };
}
