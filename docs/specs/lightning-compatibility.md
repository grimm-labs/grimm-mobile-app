# Spec: Lightning compatibility

Status: approved. Vocabulary: [GLOSSARY.md](../../GLOSSARY.md).

Grimm App rejects several common Payment Inputs (Invoices without an Amount, Bitcoin URIs, LNURL-withdraw, LNURL-auth) and sends on-chain addresses to the Lightning flow. This spec makes every entry point read Payment Inputs with the same rules, makes Lightning sends report their real outcome, and adds Withdrawal and Lightning Login.

Delivered as four pull requests, in this order. Each one ships on its own, and each builds on the one before it: Part 2 changes the screens Part 1 changes, Part 3 reuses Part 1's pending screen and limits and Part 2's routing, Part 4 reuses Part 2's routing. So each branch starts from the previous part's branch while that part's pull request is open, and from `master` once it is merged. Part 1 starts from `feat/app-lock-and-onchain-amount-fix` while #254 (App Lock) is open.

1. **PR 1**: reliable Lightning send (Part 1). Fixes two current bugs.
2. **PR 2**: Payment Input routing (Part 2). Registers the `bitcoin` URL scheme, so it needs a prebuild.
3. **PR 3**: Withdrawal (Part 3).
4. **PR 4**: Lightning Login (Part 4).

Items are numbered per part; a test plan refers to them as `P1-1`, `P2-1`…

## Current state

- `src/app/scan-qr/_layout.tsx` only knows Lightning. It sends an Invoice with an Amount to `send/transaction-details`, a Lightning Address or LNURL-pay to `send/enter-amount`, and anything else to the Lightning paste screen `send/enter-address`, pre-filled. A Bitcoin address scanned from the home screen, or from the scan button of `send-onchain/enter-address.tsx`, ends on "Sorry, payment to a Bitcoin address is not supported yet".
- The scanner and both paste screens reject an Invoice without an Amount (`lightningPayment.errors.zeroAmountNotSupported`).
- The Breez SDK parses a Bitcoin URI as `Bip21`, LNURL-withdraw as `LnurlWithdraw` and LNURL-auth as `LnurlAuth`. Every screen rejects the three.
- On-chain addresses are parsed by the Breez SDK (`useBreez().parseInput`), which needs a started SDK. While Breez is starting or down, no on-chain send is possible.
- An address or an Invoice of another network is accepted and fails later: at the Network Fee estimation for an address, with "Invalid invoice data" for an Invoice.
- `handleSendPayment` in `send/transaction-details.tsx` has no `catch`, so a failed payment shows nothing. It shows the success screen for any payment the SDK returns, including one still `Pending` after `completionTimeoutSecs: 60`, or `Failed`.
- `send/enter-amount.tsx` ignores the recipient's `minSendable`/`maxSendable` and shows "Send to" followed by the raw Payment Input.
- `src/app/+native-intent.tsx` only handles `lightning:<invoice>`, which it sends straight to `send/transaction-details`. `app.config.ts` registers only the `lightning` scheme (plus `GrimmApp`).

## Part 1: reliable Lightning send (PR 1)

### Behaviour

1. After the slide to confirm on `send/transaction-details`, the outcome depends on what the SDK returns. The same rules apply to every kind of Lightning payment: Invoice, Lightning Address, LNURL-pay.

   | SDK result | What the user sees |
   | --- | --- |
   | A `Payment` with status `Completed` | The success screen (`transaction-result/success-screen`, `transactionType: 'sent'`) with the payment's Amount, as today |
   | A `Payment` with status `Pending` | The pending screen (item 3) in `sent` mode |
   | A `Payment` with status `Failed`, no `Payment`, or an exception | An error flash message (`showErrorMessage`): "The payment could not be sent. Please try again." The user stays on the screen and the slider works again |

2. A retry reuses the same prepared payment, so it pays the same Invoice. A Lightning Invoice can only be paid once.
3. **Pending screen** `transaction-result/pending-screen`, new, with the layout of the success screen:
   - params `transactionType` (`sent` or `received`) and `satsAmount`;
   - title "Payment in progress" (`sent`) or "Withdrawal in progress" (`received`), then the Amount, then "It will appear in your transactions once it completes.";
   - its OK button runs `router.dismissAll()` then `router.replace('/')`, so Back never returns to the payment.
4. **Amount limits** on `send/enter-amount`, for a Lightning Address and LNURL-pay:
   - The screen parses its `paymentInput` with Breez, as `transaction-details` does, and reads `minSendable` and `maxSendable` (millisats). The limits in sats are `ceil(min / 1000)` and `floor(max / 1000)`.
   - While the parse is pending, Continue is disabled. If it fails, or returns something other than a Lightning Address or LNURL-pay, the screen shows `lightningPayment.errors.preparePaymentFailed` as an inline message under the Amount (not a flash message), and Continue stays disabled.
   - Outside the limits, Continue is disabled and "Enter an amount between {{min}} and {{max}}" is shown, both formatted in the user's unit (`formatBalance`). The initial Amount 0 is outside the limits, so the message shows from the start: muted while the Amount is 0, as an error once an Amount is typed.
   - When the two limits are equal, the amount is pre-filled with that value. The keypad stays enabled; any other value is outside the limits.
   - The insufficient balance check does not change: it compares the Amount with the Lightning balance, and `transaction-details` then compares the Total.
5. **"Send to"** on `send/enter-amount`: the Lightning Address (`alice@pay.usegrimm.app`) for a Lightning Address, `payRequest.domain` for LNURL-pay. Part 2 adds the Invoice case. The "Send to" line appears only once the parse succeeds: nothing while it is pending or after it fails, never the raw Payment Input.

### Changes

- `src/app/send/transaction-details.tsx`: `handleSendPayment` follows item 1, with a `catch`.
- `src/app/transaction-result/pending-screen.tsx`: new (item 3).
- `src/lib/lightning/amount-limits.ts`: new, pure. Converts millisat limits to sat limits (item 4) and checks an Amount against them. Part 3 reuses it.
- `src/app/send/enter-amount.tsx`: parse, limits and "Send to" (items 4 and 5).
- Translations: see "Translations".

### Tests

- `src/lib/lightning/__tests__/amount-limits.test.ts`: 1 500 msat gives a 2 sat minimum, 1 999 msat a 1 sat maximum; equal limits; an Amount at min − 1, min, max and max + 1.
- `src/app/send/__tests__/transaction-details.test.tsx` (extend): every row of item 1, for an Invoice and for a Lightning Address. On failure: no navigation, the error message, then a second slide calls the SDK again with the same prepared payment.
- `src/app/transaction-result/__tests__/pending-screen.test.tsx`: both modes, and the OK button.
- `src/app/send/__tests__/enter-amount.test.tsx` (extend): the limit boundaries in sats and in BTC, equal limits, Continue disabled while the parse is pending and after it fails, "Send to" for both kinds.

## Part 2: Payment Input routing (PR 2)

### Behaviour

#### One set of rules

1. Four entry points read a Payment Input, and all of them apply the rules below through one shared function:
   - the scanner (`scan-qr`), opened from the home screen or from the on-chain send;
   - the Lightning paste screen (`send/enter-address`);
   - the on-chain paste screen (`send-onchain/enter-address`);
   - links, through the new `/payment-input` route (items 17 to 20).
2. The Payment Input is trimmed, and a leading `lightning:` (in any case) is removed.
3. The rules are evaluated in this order:
   1. Empty: the entry point's existing empty-input error (`lightningPayment.errors.invalidInvoice`, `onchainSend.enterAddress.errors.invalidAddress`).
   2. Starts with `bitcoin:` (in any case): a Bitcoin URI (items 7 to 10).
   3. A Bitcoin address: validated locally for the app's network (item 11).
   4. Anything else is a Lightning format, parsed by Breez (item 14).
4. Routing table:

   | Payment Input                                                               | Destination                                                                                                               |
   | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
   | Invoice with an Amount                                                      | `send/transaction-details?rawInvoice=…`, as today                                                                         |
   | Invoice without an Amount                                                   | `send/enter-amount?paymentInput=<invoice>` (item 15), then `send/transaction-details?rawInvoice=…&amountSats=…` (item 16) |
   | Lightning Address, LNURL-pay                                                | `send/enter-amount?paymentInput=…`, as today                                                                              |
   | Bitcoin address of the app's network                                        | `send-onchain/enter-amount?recipientAddress=…`                                                                            |
   | Bitcoin URI without `lightning=`                                            | `send-onchain/enter-amount?recipientAddress=…`, plus `&amountSats=…` when the URI has an amount                           |
   | Bitcoin URI with `lightning=`                                               | The method sheet (item 8)                                                                                                 |
   | LNURL-withdraw                                                              | `receive/withdrawal` (Part 3). Until Part 3 ships: "unsupported"                                                          |
   | LNURL-auth                                                                  | `lightning-login` (Part 4). Until Part 4 ships: "unsupported"                                                             |
   | Bitcoin address of the other network                                        | "This address belongs to another Bitcoin network"                                                                         |
   | Invoice of another network                                                  | "This invoice belongs to another Bitcoin network"                                                                         |
   | Lightning format while Breez is not started                                 | "The Lightning wallet is starting. Please try again in a moment."                                                         |
   | Anything else (BOLT12, Spark address, silent payment address, unknown text) | "Sorry, we do not support this Bitcoin or Lightning address"                                                              |

5. How each entry point shows an error:
   - the scanner shows the flash message and resumes scanning after its existing 3-second pause;
   - a paste screen shows the flash message and stays as it is;
   - `/payment-input` shows the error with a Back button (item 19).
6. Navigation: the scanner and the paste screens push the destination, as today. `/payment-input` replaces itself with it.

This changes three behaviours on purpose: a Bitcoin address pasted on the Lightning screen opens the on-chain amount screen; an Invoice pasted on the on-chain screen opens the Lightning flow; the scanner no longer sends an unknown QR code to the Lightning paste screen.

#### Bitcoin URI

7. A Bitcoin URI is read by a pure `parseBitcoinUri`, following BIP21:
   - the scheme `bitcoin:` matches in any case;
   - the address is the part before `?`. It may be empty only when `lightning=` is present;
   - parameter names match in any case, and values are percent-decoded. When a parameter appears twice, the first one wins;
   - `amount` is decimal BTC: digits, at most one `.`, at most 8 decimals, greater than 0. It is converted to sats exactly, with string arithmetic, never through a float. An invalid `amount` makes the URI invalid;
   - an unknown parameter whose name starts with `req-` makes the URI invalid;
   - `label`, `message` and the other unknown parameters are ignored;
   - an invalid URI is "unsupported";
   - the address is checked like a plain address (item 11).
8. A Bitcoin URI with `lightning=` and an address presents the existing `PaymentMethodBottomSheet` in `send` mode (`send-method-lightning`, `send-method-onchain`):
   - **Lightning**: the `lightning=` value is routed as a Payment Input, with the Lightning rows of the table. A value that is not a Lightning format is "unsupported";
   - **On-chain**: the address and the amount go to `send-onchain/enter-amount`, as for a URI without `lightning=`;
   - closing the sheet without choosing: the scanner resumes scanning, a paste screen stays as it is, `/payment-input` goes back (item 19).
9. A Bitcoin URI with `lightning=` and no address (`bitcoin:?lightning=…`) skips the sheet and goes the Lightning way.
10. `send-onchain/enter-amount` accepts an optional `amountSats` param. It pre-fills the amount in the user's unit (10 000 sats shows as `10000` in sats and `0.0001` in BTC, without trailing zeros). The user can change it. Choosing the Network Fee does not change.

#### Networks

11. A Bitcoin address, plain or in a Bitcoin URI, is validated locally with BDK (`new Address(address, network)`), never with Breez. The network comes from `src/lib/bdk/network.ts`: mainnet is `Network.Bitcoin`, testnet is `Network.Testnet`.
    - Valid for the app's network: an on-chain destination.
    - Valid only for the other network: the other-network error.
    - Valid for neither: not a Bitcoin address; evaluation continues with step 4 of item 3.
12. An Invoice's network (`Bolt11InvoiceDetails.network`) is compared with the network Breez runs on: mainnet is `BitcoinNetwork.Bitcoin`, testnet is `BitcoinNetwork.Regtest` (AGENTS.md: the UI's testnet is Breez Regtest). A mismatch gives the other-network error.
13. An expired Invoice is routed normally. `send/transaction-details` shows "This invoice has expired", as today.

#### When the Lightning wallet is not ready

14. Steps 1 to 3 of item 3 never need Breez, so on-chain sends work while Breez is starting or down. Step 4 needs `isBreezInitialized`; otherwise the "starting" error. A Bitcoin URI with `lightning=` still presents the sheet; choosing Lightning then gives the "starting" error. When Breez parses a Payment Input as `BitcoinAddress` or `Bip21`, the result is "unsupported": on-chain formats are decided by steps 2 and 3 only.

#### Invoice without an Amount

15. `send/enter-amount` with an Invoice without an Amount:
    - "Send to" shows the Invoice's description, or "Lightning invoice" when it has none;
    - any Amount above 0 is accepted: there are no recipient limits;
    - Continue opens `send/transaction-details?rawInvoice=…&amountSats=…`.
16. `send/transaction-details` with `rawInvoice` and `amountSats`:
    - it prepares the payment with `prepareSend(bolt11, amountSats)` and shows that Amount, the fee and the Total;
    - the expiry countdown and the Part 1 outcomes apply as for any Invoice;
    - `amountSats` is accepted only for an Invoice without an Amount. With an Invoice that has its own Amount, the screen shows `paymentDetails.errors.invalidData`.

#### Links

17. `src/app/+native-intent.tsx` redirects every URL whose scheme is `lightning:` or `bitcoin:` (in any case) to `/payment-input?input=<the whole URL, encoded>`. Other paths do not change.
18. `app.config.ts` registers the `bitcoin` scheme next to `lightning`: iOS `CFBundleURLTypes` and Android `intentFilters`. The LUD-17 schemes (`lnurlw:`, `lnurlp:`, `keyauth:`) are not registered.
19. `/payment-input` (`src/app/payment-input.tsx`):
    - once `isDataLoaded` is true, with no Recovery Phrase (`hasSeedPhrase` false), it runs `router.replace('/')`, which leads to onboarding;
    - it shows "Reading…" while it routes. When the route needs Breez and Breez is still starting, it waits for `isBreezInitialized` and routes again;
    - when Breez failed to start (`breezError`), a Lightning format shows "The Lightning wallet could not start". On-chain formats still route;
    - its errors come with a Back button, which runs `router.dismissAll()` then `router.replace('/')`. Closing the method sheet does the same.
20. Opening a link never pays or signs in by itself: a send keeps its slide to confirm, Lightning Login keeps its confirmation (Part 4). With App Lock on, the Lock Screen covers the destination until the user unlocks (App Lock spec, Part 2 item 11).

#### Clarifications decided during Part 2 (to confirm in review)

- At `/payment-input`, the Lightning choice of the method sheet while Breez is starting shows the "starting" error (item 14) instead of waiting (item 19 waits only for the link itself). With `breezError`, it shows "could not start".
- An empty Payment Input at the scanner or at `/payment-input` (a `lightning:` link with nothing after it) shows "unsupported".
- A Bitcoin URI whose address is valid on neither network is "unsupported": the fall-through to the Breez parse of item 11 applies to a plain Payment Input only.
- The Back button of `/payment-input` reuses `paymentDetails.goBack` ("Go Back"); the spec's table has no label for it.
- The scanner stops scanning while the method sheet is open, so the camera cannot present it again behind itself.

### Changes

**Native**

- `app.config.ts`: add the `bitcoin` scheme (item 18).
- Regenerate the committed native projects with `pnpm prebuild:development`, and keep only the new scheme in `ios/*/Info.plist` and `android/app/src/main/AndroidManifest.xml`. Restore every other file.

**Logic: `src/lib/payment-input/`** (pure, unit-tested)

- `bitcoin-uri.ts`: `parseBitcoinUri(text)` returns `{ address, amountSats?, lightning? }` or `null` (item 7).
- `route-payment-input.ts`: `routePaymentInput(text, deps)` applies items 2 to 4, 9, 11, 12 and 14, and returns a `PaymentInputRoute`. `deps` gives the app network, BDK address validation, and the Breez parse (absent while Breez is not started), so the tests need neither Breez nor React. `PaymentInputRoute` is a union:
  - `{ kind: 'lightningDetails', rawInvoice }`
  - `{ kind: 'lightningAmount', paymentInput }`
  - `{ kind: 'onchainAmount', address, amountSats? }`
  - `{ kind: 'chooseMethod', onchain: { address, amountSats? }, lightning }`
  - `{ kind: 'withdrawal', paymentInput }` (Part 3)
  - `{ kind: 'lightningLogin', paymentInput }` (Part 4)
  - `{ kind: 'error', reason: 'empty' | 'unsupported' | 'otherNetworkAddress' | 'otherNetworkInvoice' | 'lightningNotReady' }`

**Hook: `src/lib/hooks/use-payment-input.ts`**

- `usePaymentInput()` wires `routePaymentInput` to `useBreez()` and bdk-rn, navigates to the destination, presents the method sheet for `chooseMethod`, and returns the route so the entry point can show its error (item 5).
- It is not re-exported from `@/lib/hooks`, because it pulls in the Breez context (like `useWalletReset`).
- `PaymentMethodBottomSheet` gets an `onDismiss` prop, for item 8.

**Screens**

- `src/app/scan-qr/_layout.tsx`, `src/app/send/enter-address.tsx`, `src/app/send-onchain/enter-address.tsx`: replace their own parsing with `usePaymentInput`.
- `src/app/send/enter-amount.tsx`: the Invoice case (item 15).
- `src/app/send/transaction-details.tsx`: `rawInvoice` with `amountSats` (item 16).
- `src/app/send-onchain/enter-amount.tsx`: the `amountSats` param (item 10).
- `src/app/payment-input.tsx`: new (item 19).
- `src/app/+native-intent.tsx` and `src/lib/lightning/deep-link.ts`: replace `extractBolt11FromLightningUri` with `toPaymentInputPath(url)` (item 17).

**Translations**

- New `paymentInput.*` keys, used by all four entry points (see "Translations").
- Delete the keys no screen uses any more (`lightningPayment.errors.bitcoinNotSupported`, `lightningPayment.errors.zeroAmountNotSupported`, and the on-chain screen's `unsupportedAddress`/`addressVerificationFailed` if unused), and update the Maestro assertions that use them.

### Tests

**Unit**

- `src/lib/payment-input/__tests__/bitcoin-uri.test.ts`: `bitcoin:` and `BITCOIN:`; an empty address with and without `lightning=`; percent-decoding; `amount` values `1`, `0.0001`, `0.00000001`, `21000000`, and the invalid `0`, `-1`, `1e-8`, `0.000000001`, `1,5`, `.`; a `req-` parameter; `label` and `message` ignored; a duplicated parameter.
- `src/lib/payment-input/__tests__/route-payment-input.test.ts`: one test per row of the routing table, on both app networks; the `lightning:` prefix in any case; the evaluation order of item 3 (a Bitcoin URI and a plain address never reach the Breez parse); the Breez `BitcoinAddress` and `Bip21` results giving "unsupported"; every Lightning format while Breez is not started.
- `src/lib/lightning/__tests__/deep-link.test.ts` (rewrite): `lightning:`, `LIGHTNING:`, `bitcoin:` and `BITCOIN:` URLs become `/payment-input` paths; other paths do not change.

**Integration** (real screens; Breez context mocked; BDK through `mock-bdk-rn`, whose `Address` must be extended to throw for an address of the wrong network)

- `src/lib/payment-input/__tests__/entry-points.test.tsx`: **one table of Payment Inputs played against all four entry points**, each expected to reach the same destination. The scanner is driven by calling the `onBarcodeScanned` handler of a mocked `CameraView`.
- The method sheet at each entry point: choosing Lightning, choosing on-chain, closing it.
- `/payment-input`: no Recovery Phrase; Breez starting, then started; `breezError`; an on-chain URI routed without Breez.
- An Invoice without an Amount, from `send/enter-amount` to `prepareSend(bolt11, amountSats)`; `amountSats` given with an Invoice that has an Amount.
- `send-onchain/enter-amount` pre-filled in sats and in BTC.

## Part 3: Withdrawal (PR 3)

### Behaviour

1. `routePaymentInput` sends LNURL-withdraw to `receive/withdrawal?paymentInput=…`. The screen parses the Payment Input again with Breez.
2. The screen shows:
   - the service's domain: the host of the `callback` URL (for example `faucet.example.com`);
   - `defaultDescription`;
   - the Amount.
3. The limits are `minWithdrawable` and `maxWithdrawable`, converted with `amount-limits` (Part 1 item 4):
   - when the two limits are equal (a fixed voucher), the Amount is shown without a keypad;
   - otherwise the Amount is pre-filled with the maximum and editable with the keypad. Outside the limits, Withdraw is disabled and "Enter an amount between {{min}} and {{max}}" is shown.
4. **Withdraw** calls `lnurlWithdraw` with the Amount and `completionTimeoutSecs: 60`. The button shows its loading state and ignores further taps until the call returns.
5. Outcome:

   | SDK result                                                    | What the user sees                                                                                                                         |
   | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
   | A `Payment` with status `Completed`                           | The success screen with `transactionType: 'received'` and the Amount                                                                       |
   | No `Payment` after 60 s, or a `Payment` with status `Pending` | The pending screen in `received` mode (Part 1 item 3)                                                                                      |
   | A `Payment` with status `Failed`, or an exception             | An error flash message: "The withdrawal could not be completed. Please try again." The user stays on the screen and can tap Withdraw again |

6. There is no confirmation step: a Withdrawal only brings funds in.

#### Clarifications decided during Part 3 (to confirm in review)

- The domain is the host of the `callback` URL without its port (`https://faucet.example.com:8443/…` shows `faucet.example.com`), and nothing when the URL is invalid.
- While Breez is starting, the screen waits for it before the parse. When the parse fails or returns something other than LNURL-withdraw, the screen shows "Sorry, we do not support this Bitcoin or Lightning address" and no Withdraw button.
- The success and pending screens show the Amount the user chose (also when the SDK returns no `Payment`).
- `lnurlWithdraw` resolves with the `Payment`, or `undefined` when there is none; the request is built by a pure `toWithdrawRequest` (`src/lib/lightning/withdrawal-request.ts`), so the 60 s timeout is unit-tested.

### Changes

- `src/lib/context/breez-context.tsx`: add `lnurlWithdraw(amountSats, withdrawRequest)` to the context and re-export the `LnurlWithdrawRequestDetails` type.
- `src/lib/lightning/domain.ts`: new, pure. Returns the host of a URL. React Native's built-in `URL` does not implement every getter, so do not rely on `URL.hostname` unless it is checked on a device.
- `src/lib/payment-input/route-payment-input.ts`: route the `LnurlWithdraw` result.
- `src/app/receive/withdrawal.tsx`: new.

### Tests

- `src/lib/lightning/__tests__/domain.test.ts`: a host with a port, a path, a query string, a subdomain; an invalid URL.
- `src/app/receive/__tests__/withdrawal.test.tsx`: domain and description shown; fixed Amount without keypad; range pre-filled with the maximum; the limit boundaries; every row of item 5; a double tap calls `lnurlWithdraw` once; a retry after an error.
- `route-payment-input.test.ts` and `entry-points.test.tsx`: LNURL-withdraw now reaches `receive/withdrawal`.

## Part 4: Lightning Login (PR 4)

### Behaviour

1. `routePaymentInput` sends LNURL-auth to `lightning-login?paymentInput=…`. The screen parses the Payment Input again with Breez.
2. The confirmation screen shows the website's domain (`LnurlAuthRequestDetails.domain`) and a title that depends on `action`:

   | `action`                                  | Title                              |
   | ----------------------------------------- | ---------------------------------- |
   | `register`                                | "Create an account on {{domain}}?" |
   | `link`                                    | "Link your account on {{domain}}?" |
   | `login`, `auth`, none, or any other value | "Sign in to {{domain}}?"           |

   Under the title: "{{domain}} will receive an identity that Grimm App creates for this website only. It cannot see your funds or your other logins." Then two buttons: **Sign in** and **Cancel**.

3. `lnurlAuth` is called only when the user taps Sign in. Cancel goes back and sends nothing.
4. `Ok`: a success flash message "Signed in to {{domain}}", then `router.dismissAll()` and `router.replace('/')`.
5. `ErrorStatus`: an error flash message "{{domain}} refused the sign-in: {{reason}}". An exception: "The sign-in could not be completed. Please try again." In both cases the user stays on the screen and can tap Sign in again.
6. Lightning Login is not a Sensitive Action. If sends ever ask for the PIN, Lightning Login follows the same rule.

#### Clarifications decided during Part 4 (to confirm in review)

- While Breez is starting, the screen waits for it before the parse. When the parse fails or returns something other than LNURL-auth, the screen shows "Sorry, we do not support this Bitcoin or Lightning address" and no Sign in button.
- The Cancel button uses a new key `lightningLogin.cancel` ("Cancel", "Annuler"); the spec's table has no label for it. Cancel is disabled while the sign-in is in progress.
- The screen has no header title: the title of item 2 is its heading.

### Changes

- `src/lib/context/breez-context.tsx`: add `lnurlAuth(requestData)` to the context and re-export `LnurlAuthRequestDetails` and `LnurlCallbackStatus_Tags`.
- `src/lib/payment-input/route-payment-input.ts`: route the `LnurlAuth` result.
- `src/app/lightning-login.tsx`: new.

### Tests

- `src/app/__tests__/lightning-login.test.tsx`: the three titles; `lnurlAuth` not called on mount, nor after Cancel; `Ok`, `ErrorStatus` with its reason, and an exception; a retry after an error.
- `route-payment-input.test.ts` and `entry-points.test.tsx`: LNURL-auth now reaches `lightning-login`.

## testIDs

- **Payment Input route:** `payment-input-screen`, `payment-input-loading`, `payment-input-error`, `payment-input-back`.
- **Method sheet:** the existing `send-method-lightning` and `send-method-onchain`.
- **Lightning amount:** `send-ln-amount-send-to`, `send-ln-amount-limits`, `send-ln-amount-error` (the parse error) (the existing `send-ln-amount-screen`, `send-ln-amount-insufficient` and `send-ln-amount-continue` stay).
- **On-chain amount:** the existing `send-onchain-amount-value` shows the pre-filled amount.
- **Pending screen:** `transaction-pending-screen`, `transaction-pending-ok`.
- **Withdrawal:** `withdrawal-screen`, `withdrawal-domain`, `withdrawal-description`, `withdrawal-amount`, `withdrawal-limits`, `withdrawal-confirm`.
- **Lightning Login:** `lightning-login-screen`, `lightning-login-title`, `lightning-login-confirm`, `lightning-login-cancel`.

## Translations

Every key goes in `en.json` and `fr.json`. The French UI uses "vous", says "portefeuille" (never "wallet") and "facture" for an Invoice, and puts a space before `?` and `:`.

| EN | FR |
| --- | --- |
| The payment could not be sent. Please try again. | Le paiement n'a pas pu être envoyé. Veuillez réessayer. |
| Payment in progress | Paiement en cours |
| Withdrawal in progress | Retrait en cours |
| It will appear in your transactions once it completes. | Il apparaîtra dans vos transactions une fois terminé. |
| Enter an amount between {{min}} and {{max}} | Saisissez un montant entre {{min}} et {{max}} |
| Lightning invoice | Facture Lightning |
| Sorry, we do not support this Bitcoin or Lightning address | Désolé, nous ne prenons pas en charge cette adresse Bitcoin ou Lightning |
| This address belongs to another Bitcoin network | Cette adresse appartient à un autre réseau Bitcoin |
| This invoice belongs to another Bitcoin network | Cette facture appartient à un autre réseau Bitcoin |
| The Lightning wallet is starting. Please try again in a moment. | Le portefeuille Lightning démarre. Veuillez réessayer dans un instant. |
| The Lightning wallet could not start | Le portefeuille Lightning n'a pas pu démarrer |
| Reading… | Lecture… |
| Withdrawal | Retrait |
| Withdraw | Retirer |
| The withdrawal could not be completed. Please try again. | Le retrait n'a pas pu aboutir. Veuillez réessayer. |
| Sign in to {{domain}}? | Se connecter à {{domain}} ? |
| Create an account on {{domain}}? | Créer un compte sur {{domain}} ? |
| Link your account on {{domain}}? | Lier votre compte sur {{domain}} ? |
| {{domain}} will receive an identity that Grimm App creates for this website only. It cannot see your funds or your other logins. | {{domain}} recevra une identité que Grimm App crée pour ce site uniquement. Il ne peut voir ni vos fonds ni vos autres connexions. |
| Sign in | Se connecter |
| Signed in to {{domain}} | Connecté à {{domain}} |
| {{domain}} refused the sign-in: {{reason}} | {{domain}} a refusé la connexion : {{reason}} |
| The sign-in could not be completed. Please try again. | La connexion n'a pas pu aboutir. Veuillez réessayer. |

## Maestro

The flows run against Breez mainnet with an empty wallet, so they cover routing and the screens before a payment, never a payment. Each part writes its own flows, in its own pull request, whenever a flow can reach the behaviour without funds; what no flow can reach goes to the manual checklist.

### Part 1

The flow needs a real Lightning Address: `admin-test@pay.usegrimm.app`, registered once by the team from a wallet it keeps, and never paid by the flows. Its LNURL-pay form is `LNURL1DP68GURN8GHJ7URP0YH82UM9VAEXJMTD9ESHQUP09EMK2MRV944KUMMHDCHKCMN4WFK8QTMPV3KKJM3DW3JHXAQJA9KPP` (the bech32 encoding of `https://pay.usegrimm.app/.well-known/lnurlp/admin-test`).

- `.maestro/send-lightning-address.yaml` (new, tags `send`, `lightning`), from the Lightning paste screen:
  - the Lightning Address opens `send-ln-amount-screen`, with `Send to admin-test@pay.usegrimm.app` in `send-ln-amount-send-to`, the limits message in `send-ln-amount-limits` from the start, and Continue disabled;
  - an Amount of 1 000 sats hides the limits message and shows `send-ln-amount-insufficient` (empty wallet); Continue stays disabled;
  - the LNURL-pay form shows "Send to pay.usegrimm.app".
- Not reachable without funds: the outcomes of item 1 and the pending screen (manual checklist).

### Part 2

Take the Invoices from the test vectors of BOLT 11: the mainnet "Please consider supporting this project" vector (no Amount) and a testnet `lntb…` vector. They are expired, which item P2-13 allows. If the Breez parse rejects them, stop and ask the user for another source.

- `.maestro/send-lightning.yaml`: the Bitcoin address pasted on the Lightning screen now opens `send-onchain-amount-screen`, instead of the error the flow checks today.
- `.maestro/send-onchain.yaml`: the invalid-input assertion uses the new "unsupported" message.
- `.maestro/send-routing.yaml` (new, tags `send`, `routing`), from the Lightning paste screen:
  - `bitcoin:bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4?amount=0.0001` opens the on-chain amount screen with `10000`;
  - the same URI with `&lightning=<the no-Amount vector>` presents the sheet. On-chain opens the on-chain amount screen; Lightning opens `send-ln-amount-screen`;
  - the no-Amount vector alone opens `send-ln-amount-screen`, with "Please consider supporting this project" in `send-ln-amount-send-to`;
  - `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx` (BIP173) shows the other-network address error;
  - the testnet Invoice vector shows the other-network Invoice error.
- `.maestro/deep-links.yaml` (new, tags `links`): `openLink` with the `bitcoin:` URI above opens the on-chain amount screen; `openLink` with `lightning:<the no-Amount vector>` opens `send-ln-amount-screen`.

### Part 3

No flow: Breez fetches an LNURL-withdraw link to read its limits, and the team has no stable LNURL-withdraw service of its own (decided with the user). A Withdrawal stays in the manual checklist.

### Part 4

Breez reads an LNURL-auth request without the network (its URL carries `tag=login` and `k1`), so the flow needs no service. It builds its requests for `example.com`, a reserved domain, with a fixed 64-hex `k1`, and never taps Sign in.

- `.maestro/lightning-login.yaml` (new, tags `lightning`, `login`):
  - the request with `action=register`, pasted on the Lightning paste screen, opens `lightning-login-screen` with "Create an account on example.com?" in `lightning-login-title`; Cancel goes back to the paste screen;
  - the request without `action`, opened with `openLink` as `lightning:<request>`, shows "Sign in to example.com?".

## Manual checklist

Maestro cannot reach these: they need funds, a real service or the camera.

- A Withdrawal from a real faucet or voucher, with a fixed Amount and with a range.
- A Lightning Login on a real website (for example stacker.news): create an account, then sign in again after a Wallet Reset and a restore of the same Recovery Phrase, and check it is the same account.
- A Lightning payment that is still `Pending` after 60 s, if one can be produced.
- With the camera: a Bitcoin URI with `lightning=` (the sheet over the camera), a plain address from the on-chain send's scan button, an unknown QR code (the error, then scanning resumes).
- iOS: a `bitcoin:` link from Notes or Safari opens Grimm App. With another wallet installed, iOS may pick the other app; that is expected.

## Docs to update

- `AGENTS.md`:
  - Navigation: `+native-intent.tsx` sends `lightning:` and `bitcoin:` links to `/payment-input`; the schemes are `GrimmApp`, `lightning` and `bitcoin`;
  - every entry point routes Payment Inputs through `usePaymentInput` (`src/lib/payment-input`), and on-chain addresses no longer need Breez;
  - the new routes: `payment-input`, `receive/withdrawal`, `lightning-login`, `transaction-result/pending-screen`.
- `.maestro/README.md`: each part adds its new flows to the coverage table.
- `README.md`: tick "LNURL-withdraw and LNURL-auth support" once Part 4 ships, and mention Bitcoin URIs (BIP21) under the on-chain features.

## Out of scope

- BOLT12 offers, Spark addresses, silent payments.
- LNURL comments (LUD-12) and the LUD-17 schemes.
- The `label` and `message` of a Bitcoin URI, and transaction notes filled from them.
- Balances in the method sheet.
- Merging the two paste screens into one Send screen.
- A fixed-Amount mode for Lightning sends.
- Asking for the PIN before a send or a Lightning Login.
