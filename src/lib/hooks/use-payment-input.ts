import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useBreez } from '@/lib/context/breez-context';
import { isValidAddress } from '@/lib/payment-input/address-network';
import type { PaymentInputDeps, PaymentInputError, PaymentInputRoute } from '@/lib/payment-input/route-payment-input';
import { routeLightningInput, routePaymentInput } from '@/lib/payment-input/route-payment-input';

type ChooseMethodRoute = Extract<PaymentInputRoute, { kind: 'chooseMethod' }>;

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
      const go: typeof router.push = (href) => (navigation === 'push' ? router.push(href) : router.replace(href));
      switch (route.kind) {
        case 'lightningDetails':
          go({ pathname: '/send/transaction-details', params: { rawInvoice: route.rawInvoice } });
          break;
        case 'lightningAmount':
          go({ pathname: '/send/enter-amount', params: { paymentInput: route.paymentInput } });
          break;
        case 'onchainAmount':
          go({
            pathname: '/send-onchain/enter-amount',
            params: route.amountSats === undefined ? { recipientAddress: route.address } : { recipientAddress: route.address, amountSats: String(route.amountSats) },
          });
          break;
        case 'chooseMethod':
          choiceRef.current = route;
          setIsSheetOpen(true);
          sheetRef.current?.present();
          break;
        case 'error':
          callbacksRef.current.onError(route.reason);
          break;
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
