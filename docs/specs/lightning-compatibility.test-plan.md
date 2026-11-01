# Test plan: Lightning compatibility

Traceability from [the spec](./lightning-compatibility.md) to the automated tests. One row per test; an item has as many rows as it needs to be fully covered. Every row of the spec's tables (the outcome tables, the routing table, the Lightning Login titles) has its own row here.

Levels: **Unit** (Jest, pure functions in `src/lib/…`, no React), **Integration** (Jest, real screens + real `usePaymentInput` + real `src/lib/payment-input` and `src/lib/lightning`, only the boundaries faked: `useBreez()`, `bdk-rn` through `mock-bdk-rn`, expo-router, expo-camera), **E2E** (Maestro, `.maestro/`), **Manual** (real services and real hardware; never replaces an automated row).

Status: **green** means the test was seen red, then green. **planned** means the test is not written yet. **not run** means the test is written but was never executed.

The shared fakes live in `src/lib/payment-input/__tests__/helpers/`: a controllable `useBreez()` fake and builders for Breez parse results (an Invoice with or without an Amount, on a given network; a Lightning Address; LNURL-pay, -withdraw and -auth).

## Part 1: reliable Lightning send

Short names: `limits` = `src/lib/lightning/__tests__/amount-limits.test.ts`; `amount` = `src/lib/__tests__/bitcoin-amount.test.ts`; `details` = `src/app/send/__tests__/transaction-details.test.tsx`; `pending` = `src/app/transaction-result/__tests__/pending-screen.test.tsx`; `ln-amount` = `src/app/send/__tests__/enter-amount.test.tsx`; `i18n` = `src/translations/__tests__/lightning-compatibility-translations.test.ts`.

In `details`, the outcome rows run once per kind of Lightning payment (`describe.each`): Invoice, Lightning Address and LNURL-pay, so each row stands for three tests. In `ln-amount`, the boundary rows run once per unit (`describe.each`: SATS, BTC) with the limits 1 500 msat and 5 000 999 msat, that is 2 and 5 000 sats.

| Item | Level | Test file › test name | Status |
| --- | --- | --- | --- |
| P1-1 (row `Completed`) | Integration | `details` › {kind}: `Completed` opens the success screen with the payment's Amount | green |
| P1-1 (row `Pending`) | Integration | `details` › {kind}: `Pending` opens the pending screen in sent mode with the payment's Amount | green |
| P1-1 (row `Failed`) | Integration | `details` › {kind}: `Failed` shows the send error and stays on the screen | green |
| P1-1 (row no `Payment`) | Integration | `details` › {kind}: no Payment shows the send error and stays on the screen | green |
| P1-1 (row exception) | Integration | `details` › {kind}: an exception shows the send error and stays on the screen | green |
| P1-1 | Integration | `details` › {kind}: the slider works again after a failure | green |
| P1-2 | Integration | `details` › {kind}: a second slide after a failure pays the same prepared payment again | green |
| P1-3 | Integration | `pending` › sent mode: "Payment in progress", the Amount, then the note | green |
| P1-3 | Integration | `pending` › received mode: "Withdrawal in progress", the Amount, then the note | green |
| P1-3 | Integration | `pending` › shows the Amount in the user's unit (BTC) | green |
| P1-3 | Integration | `pending` › OK runs dismissAll then replace('/') | green |
| P1-4 | Unit | `limits` › converts a 1 500 msat minimum to 2 sats (rounds up) | green |
| P1-4 | Unit | `limits` › converts a 1 999 msat maximum to 1 sat (rounds down) | green |
| P1-4 | Unit | `limits` › converts whole sats exactly | green (red under the mutation 1 sat = 1 024 msat) |
| P1-4 | Unit | `limits` › an Amount at min − 1 or max + 1 is outside, at min or max is inside | green |
| P1-4 | Unit | `limits` › equal limits: the limits are fixed and only that Amount is inside | green |
| P1-4 | Unit | `amount` › writes sats as a whole number in SATS | green (red under a mutation) |
| P1-4 | Unit | `amount` › writes sats in BTC without trailing zeros | green |
| P1-4 | Unit | `amount` › writes 0 as the keypad does | green (red under a mutation) |
| P1-4 | Integration | `ln-amount` › Continue is disabled while Breez is not started (the parse cannot start) | green |
| P1-4 | Integration | `ln-amount` › parses the Payment Input once Breez is started | green |
| P1-4 | Integration | `ln-amount` › Continue is disabled while the parse is pending | green |
| P1-4 | Integration | `ln-amount` › a failed parse shows preparePaymentFailed and Continue stays disabled | green |
| P1-4 | Integration | `ln-amount` › a parse result that is neither a Lightning Address nor LNURL-pay shows preparePaymentFailed and Continue stays disabled | green |
| P1-4 | Integration | `ln-amount` › in {unit} › at min − 1, Continue enabled: false, with the limits message when disabled | green |
| P1-4 | Integration | `ln-amount` › in {unit} › at min, Continue enabled: true, with the limits message when disabled | green |
| P1-4 | Integration | `ln-amount` › in {unit} › at max, Continue enabled: true, with the limits message when disabled | green |
| P1-4 | Integration | `ln-amount` › in {unit} › at max + 1, Continue enabled: false, with the limits message when disabled | green |
| P1-4 | Integration | `ln-amount` › the limits message shows min and max in the user's unit ({unit}), from the start | green |
| P1-4 | Integration | `ln-amount` › reads the limits of LNURL-pay too | green |
| P1-4 | Integration | `ln-amount` › equal limits pre-fill the Amount ({unit}); the keypad stays enabled and any other value is outside the limits | green |
| P1-4 | Integration | `ln-amount` › an Amount within the limits but above the Lightning balance shows the insufficient balance message | green |
| P1-4 | Integration | `ln-amount` › accepts an Amount equal to the Lightning balance (the Total is checked on the next screen) | green |
| P1-4 | Integration | `ln-amount` › Continue opens transaction-details with the Payment Input and the Amount in sats | green |
| P1-4 | Integration | `ln-amount` › Continue sends the Amount in sats when it is entered in BTC | green |
| P1-5 | Integration | `ln-amount` › "Send to" shows the Lightning Address | green |
| P1-5 | Integration | `ln-amount` › "Send to" shows the domain for LNURL-pay | green |
| P1-5 | Integration | `ln-amount` › Continue is disabled while the parse is pending (no "Send to" while pending); a failed parse … (no "Send to" after a failure) | green |
| testIDs | Integration | `pending` and `ln-amount` select by `transaction-pending-screen`, `transaction-pending-ok`, `send-ln-amount-send-to`, `send-ln-amount-limits`, `send-ln-amount-error`, `send-ln-amount-continue`, `send-ln-amount-insufficient` | green |
| Translations | Unit | `i18n` › EN and FR have the same Part 1 keys, with the spec copy | green |
| Translations | Unit | `i18n` › fills in the limits in both languages | green |

## Part 2: Payment Input routing

Short names: `uri` = `src/lib/payment-input/__tests__/bitcoin-uri.test.ts`; `route` = `src/lib/payment-input/__tests__/route-payment-input.test.ts`; `entry` = `src/lib/payment-input/__tests__/entry-points.test.tsx`; `link-route` = `src/app/__tests__/payment-input.test.tsx`; `deep-link` = `src/lib/lightning/__tests__/deep-link.test.ts`; `intent` = `src/app/__tests__/native-intent.test.ts`; `schemes` = `src/lib/payment-input/__tests__/url-schemes.test.ts`; `onchain-amount` = `src/app/send-onchain/__tests__/enter-amount.test.tsx`; `lock-screen` = `src/components/__tests__/lock-screen.test.tsx`; plus `details`, `ln-amount` and `i18n` from Part 1.

`route` runs every row on both app networks (`describe.each`: mainnet, testnet). `entry` plays **one table of Payment Inputs** against the four entry points (`describe.each`: scanner, Lightning paste screen, on-chain paste screen, `/payment-input`): each case names its destination (pathname and params) or its error, and the test body is shared, so a new case runs against all four without new test code.

### Routing table (P2-4)

| Row                                         | Level       | Test file › test name                                                                                        | Status  |
| ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ------- |
| Invoice with an Amount                      | Unit        | `route` › {network}: an Invoice with an Amount → lightningDetails                                            | planned |
| Invoice with an Amount                      | Integration | `entry` › {entry point}: Invoice with an Amount → send/transaction-details                                   | planned |
| Invoice without an Amount                   | Unit        | `route` › {network}: an Invoice without an Amount → lightningAmount                                          | planned |
| Invoice without an Amount                   | Integration | `entry` › {entry point}: Invoice without an Amount → send/enter-amount                                       | planned |
| Lightning Address                           | Unit        | `route` › {network}: a Lightning Address → lightningAmount                                                   | planned |
| Lightning Address                           | Integration | `entry` › {entry point}: Lightning Address → send/enter-amount                                               | planned |
| LNURL-pay                                   | Unit        | `route` › {network}: LNURL-pay → lightningAmount                                                             | planned |
| LNURL-pay                                   | Integration | `entry` › {entry point}: LNURL-pay → send/enter-amount                                                       | planned |
| Bitcoin address of the app's network        | Unit        | `route` › {network}: an address of the app's network → onchainAmount                                         | planned |
| Bitcoin address of the app's network        | Integration | `entry` › {entry point}: address of the app's network → send-onchain/enter-amount                            | planned |
| Bitcoin URI without `lightning=`            | Unit        | `route` › {network}: a Bitcoin URI without lightning= → onchainAmount, with amountSats when it has an amount | planned |
| Bitcoin URI without `lightning=`            | Integration | `entry` › {entry point}: Bitcoin URI with an amount → send-onchain/enter-amount with amountSats              | planned |
| Bitcoin URI without `lightning=`            | Integration | `entry` › {entry point}: Bitcoin URI without an amount → send-onchain/enter-amount without amountSats        | planned |
| Bitcoin URI with `lightning=`               | Unit        | `route` › {network}: a Bitcoin URI with lightning= → chooseMethod                                            | planned |
| Bitcoin URI with `lightning=`               | Integration | `entry` › {entry point}: Bitcoin URI with lightning= presents the method sheet                               | planned |
| LNURL-withdraw (Part 2)                     | Unit        | `route` › {network}: LNURL-withdraw → unsupported (replaced in Part 3)                                       | planned |
| LNURL-auth (Part 2)                         | Unit        | `route` › {network}: LNURL-auth → unsupported (replaced in Part 4)                                           | planned |
| Bitcoin address of the other network        | Unit        | `route` › mainnet: a tb1… address → otherNetworkAddress; testnet: a bc1… address → otherNetworkAddress       | planned |
| Bitcoin address of the other network        | Integration | `entry` › {entry point}: address of the other network → the other-network address error                      | planned |
| Invoice of another network                  | Unit        | `route` › mainnet: a Regtest Invoice → otherNetworkInvoice; a Bitcoin Invoice is accepted                    | planned |
| Invoice of another network                  | Unit        | `route` › testnet: a Bitcoin Invoice → otherNetworkInvoice; a Regtest Invoice is accepted                    | planned |
| Invoice of another network                  | Unit        | `route` › {network}: a Testnet3 Invoice → otherNetworkInvoice                                                | planned |
| Invoice of another network                  | Integration | `entry` › {entry point}: Invoice of another network → the other-network Invoice error                        | planned |
| Lightning format while Breez is not started | Unit        | `route` › {network}: every Lightning format without the Breez parse → lightningNotReady                      | planned |
| Lightning format while Breez is not started | Integration | `entry` › {entry point}: Breez not started, every Lightning format → the "starting" error                    | planned |
| Anything else (BOLT12)                      | Unit        | `route` › {network}: a BOLT12 offer → unsupported                                                            | planned |
| Anything else (Spark address)               | Unit        | `route` › {network}: a Spark address → unsupported                                                           | planned |
| Anything else (silent payment address)      | Unit        | `route` › {network}: a silent payment address → unsupported                                                  | planned |
| Anything else (unknown text)                | Unit        | `route` › {network}: unknown text (the Breez parse rejects it) → unsupported                                 | planned |
| Anything else                               | Integration | `entry` › {entry point}: unknown text → the "unsupported" error                                              | planned |

### Items

| Item         | Level       | Test file › test name                                                                                                                  | Status  |
| ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| P2-1         | Integration | `entry` › the four entry points reach the same destination for every case of the table (`describe.each` above)                         | planned |
| P2-2         | Unit        | `route` › trims the Payment Input                                                                                                      | planned |
| P2-2         | Unit        | `route` › removes a leading lightning:, LIGHTNING: or LiGhTnInG: before the Breez parse                                                | planned |
| P2-2         | Integration | `entry` › {entry point}: lightning:<Invoice> → send/transaction-details                                                                | planned |
| P2-3 (empty) | Unit        | `route` › an empty or blank Payment Input → empty, without the Breez parse                                                             | planned |
| P2-3 (empty) | Integration | `entry` › Lightning paste screen: empty → invalidInvoice; on-chain paste screen: empty → invalidAddress                                | planned |
| P2-3 (order) | Unit        | `route` › a Bitcoin URI never reaches the Breez parse, even when Breez is started                                                      | planned |
| P2-3 (order) | Unit        | `route` › a plain address never reaches the Breez parse, even when Breez is started                                                    | planned |
| P2-3 (order) | Unit        | `route` › text that is not a Bitcoin address for either network goes to the Breez parse                                                | planned |
| P2-5         | Integration | `entry` › scanner: shows the error as a flash message, then scans again after the 3-second pause                                       | planned |
| P2-5         | Integration | `entry` › scanner: an unknown QR code never navigates                                                                                  | planned |
| P2-5         | Integration | `entry` › paste screens: show the error as a flash message and keep the input                                                          | planned |
| P2-5         | Integration | `link-route` › shows the error with a Back button                                                                                      | planned |
| P2-6         | Integration | `entry` › scanner and paste screens push the destination                                                                               | planned |
| P2-6         | Integration | `link-route` › replaces itself with the destination, never pushes                                                                      | planned |
| P2-7         | Unit        | `uri` › matches bitcoin: and BITCOIN:                                                                                                  | planned |
| P2-7         | Unit        | `uri` › returns null for text that is not a Bitcoin URI                                                                                | planned |
| P2-7         | Unit        | `uri` › the address is the part before ?                                                                                               | planned |
| P2-7         | Unit        | `uri` › an empty address is valid only with lightning=                                                                                 | planned |
| P2-7         | Unit        | `uri` › parameter names match in any case                                                                                              | planned |
| P2-7         | Unit        | `uri` › percent-decodes the values                                                                                                     | planned |
| P2-7         | Unit        | `uri` › amount 1, 0.0001, 0.00000001 and 21000000 give 100 000 000, 10 000, 1 and 2 100 000 000 000 000 sats                           | planned |
| P2-7         | Unit        | `uri` › converts without float rounding (0.3, 1.15, 0.29, 20999999.99999999)                                                           | planned |
| P2-7         | Unit        | `uri` › amount 0, -1, 1e-8, 0.000000001, 1,5 and . make the URI invalid                                                                | planned |
| P2-7         | Unit        | `uri` › an unknown req- parameter makes the URI invalid, in any case                                                                   | planned |
| P2-7         | Unit        | `uri` › label, message and other unknown parameters are ignored                                                                        | planned |
| P2-7         | Unit        | `uri` › when a parameter appears twice, the first one wins (amount, lightning)                                                         | planned |
| P2-7         | Unit        | `route` › {network}: an invalid Bitcoin URI → unsupported                                                                              | planned |
| P2-7         | Unit        | `route` › {network}: a Bitcoin URI with an address of the other network → otherNetworkAddress                                          | planned |
| P2-8         | Integration | `entry` › {entry point}: sheet, Lightning routes the lightning= value                                                                  | planned |
| P2-8         | Integration | `entry` › {entry point}: sheet, on-chain keeps the address and the URI's amount                                                        | planned |
| P2-8         | Integration | `entry` › {entry point}: sheet, Lightning with a value that is not a Lightning format → unsupported                                    | planned |
| P2-8         | Integration | `entry` › scanner: closing the sheet scans again                                                                                       | planned |
| P2-8         | Integration | `entry` › paste screens: closing the sheet keeps the input and does not navigate                                                       | planned |
| P2-8         | Integration | `link-route` › closing the sheet runs dismissAll then replace('/')                                                                     | planned |
| P2-9         | Unit        | `route` › {network}: bitcoin:?lightning=… → the Lightning route, no chooseMethod                                                       | planned |
| P2-9         | Integration | `entry` › {entry point}: bitcoin:?lightning=<Invoice> skips the sheet                                                                  | planned |
| P2-10        | Integration | `onchain-amount` › amountSats=10000 shows 10000 in SATS                                                                                | planned |
| P2-10        | Integration | `onchain-amount` › amountSats=10000 shows 0.0001 in BTC                                                                                | planned |
| P2-10        | Integration | `onchain-amount` › the pre-filled Amount can be changed, and Continue sends the changed Amount with the chosen Network Fee             | planned |
| P2-11        | Unit        | `route` › validates addresses with BDK for Network.Bitcoin on mainnet and Network.Testnet on testnet                                   | planned |
| P2-11        | Unit        | `src/lib/bdk/__tests__/*` › the existing BDK tests pass with the stricter `mock-bdk-rn` Address                                        | planned |
| P2-12        | Unit        | `route` (rows "Invoice of another network" above)                                                                                      | planned |
| P2-13        | Unit        | `route` › {network}: an expired Invoice is routed normally                                                                             | planned |
| P2-13        | Integration | `details` › an expired Invoice shows "This invoice has expired"                                                                        | planned |
| P2-14        | Unit        | `route` › {network}: the Breez results BitcoinAddress and Bip21 → unsupported                                                          | planned |
| P2-14        | Integration | `entry` › {entry point}: Breez not started, a plain address and a Bitcoin URI without lightning= still reach send-onchain/enter-amount | planned |
| P2-14        | Integration | `entry` › {entry point}: Breez not started, a Bitcoin URI with lightning= presents the sheet; Lightning gives the "starting" error     | planned |
| P2-15        | Integration | `ln-amount` › Invoice without an Amount: "Send to" shows the description                                                               | planned |
| P2-15        | Integration | `ln-amount` › Invoice without an Amount: "Send to" shows "Lightning invoice" without a description                                     | planned |
| P2-15        | Integration | `ln-amount` › Invoice without an Amount: any Amount above 0 is accepted, no limits message                                             | planned |
| P2-15        | Integration | `ln-amount` › Invoice without an Amount: Continue opens transaction-details with rawInvoice and amountSats                             | planned |
| P2-16        | Integration | `details` › rawInvoice + amountSats: prepareSend(bolt11, amountSats), shows that Amount, the fee and the Total                         | planned |
| P2-16        | Integration | `details` › rawInvoice + amountSats: the expiry countdown is shown                                                                     | planned |
| P2-16        | Integration | `details` › rawInvoice + amountSats: `Completed` opens the success screen (Part 1 outcomes apply)                                      | planned |
| P2-16        | Integration | `details` › amountSats with an Invoice that has its own Amount shows invalidData and never calls prepareSend                           | planned |
| P2-17        | Unit        | `deep-link` › lightning:, LIGHTNING:, bitcoin: and BITCOIN: URLs become /payment-input?input=<encoded URL>                             | planned |
| P2-17        | Unit        | `deep-link` › the encoded URL survives a round trip (?, &, =, %)                                                                       | planned |
| P2-17        | Unit        | `deep-link` › other paths are not changed                                                                                              | planned |
| P2-17        | Unit        | `intent` › redirectSystemPath sends lightning: and bitcoin: links to /payment-input and leaves other paths                             | planned |
| P2-18        | Unit        | `schemes` › app.config registers bitcoin and lightning on iOS and Android, and no LUD-17 scheme                                        | planned |
| P2-18        | Unit        | `schemes` › the committed AndroidManifest.xml and Info.plist register bitcoin                                                          | planned |
| P2-19        | Integration | `link-route` › without a Recovery Phrase, replaces with / once the data is loaded                                                      | planned |
| P2-19        | Integration | `link-route` › waits for the data to be loaded                                                                                         | planned |
| P2-19        | Integration | `link-route` › shows "Reading…" while it routes                                                                                        | planned |
| P2-19        | Integration | `link-route` › Breez starting, then started: routes once Breez is ready                                                                | planned |
| P2-19        | Integration | `link-route` › breezError with a Lightning format shows "could not start"                                                              | planned |
| P2-19        | Integration | `link-route` › breezError with an on-chain Bitcoin URI still routes                                                                    | planned |
| P2-19        | Integration | `link-route` › Back runs dismissAll then replace('/')                                                                                  | planned |
| P2-20        | Integration | `entry` › {entry point}: routing never pays (executeSend and executeLnurlPay are never called)                                         | planned |
| P2-20        | Integration | `lock-screen` › a screen opened behind the Lock Screen (link, notification) is shown after unlocking (existing)                        | green   |
| testIDs      | Integration | `link-route`, `entry`, `ln-amount`, `onchain-amount` select by the spec's testIDs                                                      | planned |
| Translations | Unit        | `i18n` › EN and FR have the same Part 2 keys, with the spec's copy; the removed keys are gone                                          | planned |

## Part 3: Withdrawal

Short names: `domain` = `src/lib/lightning/__tests__/domain.test.ts`; `withdrawal` = `src/app/receive/__tests__/withdrawal.test.tsx`; plus `route`, `entry`, `limits` and `i18n`.

| Item                               | Level       | Test file › test name                                                                                                      | Status  |
| ---------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| P3-1                               | Unit        | `route` › {network}: LNURL-withdraw → withdrawal                                                                           | planned |
| P3-1                               | Integration | `entry` › {entry point}: LNURL-withdraw → receive/withdrawal                                                               | planned |
| P3-1                               | Integration | `withdrawal` › parses the Payment Input again with Breez                                                                   | planned |
| P3-1                               | Integration | `withdrawal` › a parse result that is not LNURL-withdraw shows an error and no Withdraw button                             | planned |
| P3-2                               | Unit        | `domain` › returns the host of a URL with a port, a path, a query string, a subdomain                                      | planned |
| P3-2                               | Unit        | `domain` › returns null for an invalid URL                                                                                 | planned |
| P3-2                               | Integration | `withdrawal` › shows the domain of the callback and defaultDescription                                                     | planned |
| P3-3                               | Integration | `withdrawal` › equal limits show the Amount without a keypad                                                               | planned |
| P3-3                               | Integration | `withdrawal` › a range is pre-filled with the maximum and editable                                                         | planned |
| P3-3                               | Integration | `withdrawal` › in SATS: Withdraw is disabled with the limits message at min − 1 and max + 1, enabled at min and max        | planned |
| P3-3                               | Integration | `withdrawal` › in BTC: Withdraw is disabled with the limits message at min − 1 and max + 1, enabled at min and max         | planned |
| P3-4                               | Unit        | `src/lib/lightning/__tests__/withdrawal-request.test.ts` › the request has the Amount in sats and completionTimeoutSecs 60 | planned |
| P3-4                               | Integration | `withdrawal` › Withdraw calls lnurlWithdraw with the Amount in sats and the parsed request                                 | planned |
| P3-4                               | Integration | `withdrawal` › a double tap on Withdraw calls lnurlWithdraw once; the button shows its loading state                       | planned |
| P3-5 (row `Completed`)             | Integration | `withdrawal` › `Completed` opens the success screen with transactionType received and the Amount                           | planned |
| P3-5 (row no `Payment` after 60 s) | Integration | `withdrawal` › no Payment opens the pending screen in received mode                                                        | planned |
| P3-5 (row `Pending`)               | Integration | `withdrawal` › `Pending` opens the pending screen in received mode                                                         | planned |
| P3-5 (row `Failed`)                | Integration | `withdrawal` › `Failed` shows the withdrawal error and stays on the screen                                                 | planned |
| P3-5 (row exception)               | Integration | `withdrawal` › an exception shows the withdrawal error and stays on the screen                                             | planned |
| P3-5                               | Integration | `withdrawal` › a retry after an error calls lnurlWithdraw again                                                            | planned |
| P3-6                               | Integration | `withdrawal` › one tap on Withdraw calls lnurlWithdraw, with no confirmation step                                          | planned |
| testIDs                            | Integration | `withdrawal` selects by the spec's testIDs                                                                                 | planned |
| Translations                       | Unit        | `i18n` › EN and FR have the same Part 3 keys, with the spec's copy                                                         | planned |

## Part 4: Lightning Login

Short names: `login` = `src/app/__tests__/lightning-login.test.tsx`; plus `route`, `entry` and `i18n`.

| Item                     | Level       | Test file › test name                                                                                | Status  |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------- | ------- |
| P4-1                     | Unit        | `route` › {network}: LNURL-auth → lightningLogin                                                     | planned |
| P4-1                     | Integration | `entry` › {entry point}: LNURL-auth → lightning-login                                                | planned |
| P4-1                     | Integration | `login` › parses the Payment Input again with Breez                                                  | planned |
| P4-1                     | Integration | `login` › a parse result that is not LNURL-auth shows an error and no Sign in button                 | planned |
| P4-2 (title `register`)  | Integration | `login` › action register: "Create an account on {{domain}}?"                                        | planned |
| P4-2 (title `link`)      | Integration | `login` › action link: "Link your account on {{domain}}?"                                            | planned |
| P4-2 (title `login`)     | Integration | `login` › action login: "Sign in to {{domain}}?"                                                     | planned |
| P4-2 (title `auth`)      | Integration | `login` › action auth: "Sign in to {{domain}}?"                                                      | planned |
| P4-2 (title none)        | Integration | `login` › no action: "Sign in to {{domain}}?"                                                        | planned |
| P4-2 (title other value) | Integration | `login` › an unknown action: "Sign in to {{domain}}?"                                                | planned |
| P4-2                     | Integration | `login` › shows the identity note with the domain, Sign in and Cancel                                | planned |
| P4-3                     | Integration | `login` › lnurlAuth is not called on mount                                                           | planned |
| P4-3                     | Integration | `login` › Cancel goes back and never calls lnurlAuth                                                 | planned |
| P4-3                     | Integration | `login` › each tap on Sign in calls lnurlAuth exactly once                                           | planned |
| P4-4                     | Integration | `login` › `Ok`: "Signed in to {{domain}}", then dismissAll and replace('/')                          | planned |
| P4-5                     | Integration | `login` › `ErrorStatus`: "{{domain}} refused the sign-in: {{reason}}", stays on the screen           | planned |
| P4-5                     | Integration | `login` › an exception: "The sign-in could not be completed. Please try again.", stays on the screen | planned |
| P4-5                     | Integration | `login` › a retry after an error calls lnurlAuth again                                               | planned |
| P4-6                     | Integration | `login` › with App Lock on, Sign in calls lnurlAuth without asking for the PIN                       | planned |
| testIDs                  | Integration | `login` selects by the spec's testIDs                                                                | planned |
| Translations             | Unit        | `i18n` › EN and FR have the same Part 4 keys, with the spec's copy                                   | planned |

## Maestro

Each part writes its flows in its own pull request (spec, "Maestro"). They run against Breez mainnet with an empty wallet.

| Part | Flow | Covers | Status |
| --- | --- | --- | --- |
| 1 | `.maestro/send-lightning-address.yaml` (new) | P1-4 (parse, limits message from the start, Continue disabled), P1-5 (Lightning Address and LNURL-pay), insufficient balance | not run (syntax checked); needs `admin-test@pay.usegrimm.app` registered |
| 1 | — | P1-1, P1-2, P1-3: need funds | manual checklist |
| 2 | `.maestro/send-lightning.yaml` (changed) | P2-4 (address of the app's network pasted on the Lightning screen), P2-1 | planned |
| 2 | `.maestro/send-onchain.yaml` (changed) | P2-4 ("unsupported" message) | planned |
| 2 | `.maestro/send-routing.yaml` (new) | P2-4, P2-7, P2-8, P2-9, P2-10, P2-11, P2-12, P2-13, P2-15 | planned |
| 2 | `.maestro/deep-links.yaml` (new) | P2-17, P2-18, P2-19 | planned |
| 3 | — | no stable LNURL-withdraw service (decided with the user) | manual checklist |
| 4 | `.maestro/lightning-login.yaml` (new) | P4-1, P4-2 (`register`, no action), P4-3 (Cancel) | planned |

## Manual checklist

Real services and real hardware, on top of the automated rows above.

| Check                                                                                                                                | Covers       | Status  |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------- |
| A Withdrawal from a real faucet or voucher, fixed Amount and range                                                                   | P3-1 to P3-5 | planned |
| A Lightning Login on a real website, then again after a Wallet Reset and a restore: same account                                     | P4-1 to P4-5 | planned |
| A Lightning payment still `Pending` after 60 s, if one can be produced                                                               | P1-1, P1-3   | planned |
| Camera: a Bitcoin URI with lightning= (the sheet over the camera), a plain address from the on-chain scan button, an unknown QR code | P2-5, P2-8   | planned |
| iOS: a bitcoin: link from Notes or Safari opens Grimm App                                                                            | P2-18        | planned |

## Mutations seen red

Each line was changed on its own, the Part 1 suites were run, then the line was restored.

### Part 1

| Mutation | Caught by |
| --- | --- |
| `Pending` treated as `Completed` | `details` › {kind}: `Pending` opens the pending screen … (3 tests) |
| The `catch` of `handleSendPayment` removed | `details` › {kind}: an exception shows the send error …; the slider works again after a failure; a second slide after a failure … (9 tests) |
| `ceil` and `floor` swapped in `toSatLimits` | `limits` › an Amount at min − 1 or max + 1 …; `ln-amount` › at min − 1 and at max + 1 (SATS and BTC), the limits message (SATS and BTC), reads the limits of LNURL-pay too (10 tests) |
| `>` instead of `>=` at the minimum | `limits` › an Amount at min − 1 …, equal limits …; `ln-amount` › at min (SATS and BTC), equal limits pre-fill (SATS and BTC) (6 tests) |
| `<` instead of `<=` at the maximum | `limits` › an Amount at min − 1 …, equal limits …; `ln-amount` › at max (SATS and BTC), equal limits pre-fill (SATS and BTC), reads the limits of LNURL-pay too (7 tests) |
| 1 sat = 1 024 msat | `limits` › converts whole sats exactly (+ 2 more) |
| `toKeypadAmount` writes SATS with a thousands separator | `amount` › writes sats as a whole number in SATS |
| `toKeypadAmount` keeps the trailing zeros in BTC | `amount` › writes sats in BTC without trailing zeros; writes 0 as the keypad does |
