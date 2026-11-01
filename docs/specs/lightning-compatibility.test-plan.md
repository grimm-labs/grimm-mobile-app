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

Short names: `uri` = `src/lib/payment-input/__tests__/bitcoin-uri.test.ts`; `route` = `src/lib/payment-input/__tests__/route-payment-input.test.ts`; `address` = `src/lib/payment-input/__tests__/address-network.test.ts`; `entry` = `src/lib/payment-input/__tests__/entry-points.test.tsx`; `link-route` = `src/app/__tests__/payment-input.test.tsx`; `hook` = `src/lib/hooks/__tests__/use-payment-input.test.tsx`; `sheet` = `src/components/modal/__tests__/payment-method-bottom-sheet.test.tsx`; `scanner` = `src/app/scan-qr/__tests__/scan-qr.test.tsx`; `deep-link` = `src/lib/lightning/__tests__/deep-link.test.ts`; `intent` = `src/app/__tests__/native-intent.test.ts`; `schemes` = `src/lib/payment-input/__tests__/url-schemes.test.ts`; `onchain-amount` = `src/app/send-onchain/__tests__/enter-amount.test.tsx`; `lock-screen` = `src/components/__tests__/lock-screen.test.tsx`; plus `details`, `ln-amount` and `i18n` from Part 1.

`route` runs every row on both app networks (`describe.each`: mainnet, testnet). `entry` plays **one table of Payment Inputs** (`CASES`) against the four entry points (`describe.each`: scanner, Lightning paste screen, on-chain paste screen, `/payment-input`): each case names its destination (pathname and params), its error, or the method sheet, and the test body is shared, so a new case runs against all four without new test code. `{entry point}` below stands for the four, `{network}` for the two.

### Routing table (P2-4)

| Row | Level | Test file › test name | Status |
| --- | --- | --- | --- |
| Invoice with an Amount | Unit | `route` › {network}: an Invoice with an Amount → lightningDetails | green |
| Invoice with an Amount | Integration | `entry` › {entry point}: Invoice with an Amount | green |
| Invoice without an Amount | Unit | `route` › {network}: an Invoice without an Amount → lightningAmount | green |
| Invoice without an Amount | Integration | `entry` › {entry point}: Invoice without an Amount | green |
| Lightning Address | Unit | `route` › {network}: a Lightning Address → lightningAmount | green |
| Lightning Address | Integration | `entry` › {entry point}: Lightning Address | green |
| LNURL-pay | Unit | `route` › {network}: LNURL-pay → lightningAmount | green |
| LNURL-pay | Integration | `entry` › {entry point}: LNURL-pay | green |
| Bitcoin address of the app's network | Unit | `route` › {network}: an address of the app's network → onchainAmount | green |
| Bitcoin address of the app's network | Integration | `entry` › {entry point}: address of the app's network (mainnet), (testnet) | green |
| Bitcoin URI without `lightning=` | Unit | `route` › {network}: a Bitcoin URI without lightning= → onchainAmount, with amountSats when it has an amount | green |
| Bitcoin URI without `lightning=` | Integration | `entry` › {entry point}: Bitcoin URI with an amount; Bitcoin URI without an amount | green |
| Bitcoin URI with `lightning=` | Unit | `route` › {network}: a Bitcoin URI with lightning= → chooseMethod | green |
| Bitcoin URI with `lightning=` | Integration | `entry` › {entry point}: Bitcoin URI with lightning= (the sheet shows, no navigation) | green |
| LNURL-withdraw (until Part 3) | Unit | `route` › {network}: LNURL-withdraw → unsupported (replaced in Part 3) | green |
| LNURL-withdraw (until Part 3) | Integration | `entry` › {entry point}: LNURL-withdraw (until Part 3) | green |
| LNURL-auth (until Part 4) | Unit | `route` › {network}: LNURL-auth → unsupported (replaced in Part 4) | green |
| LNURL-auth (until Part 4) | Integration | `entry` › {entry point}: LNURL-auth (until Part 4) | green |
| Bitcoin address of the other network | Unit | `route` › {network}: an address of the other network → otherNetworkAddress | green |
| Bitcoin address of the other network | Integration | `entry` › {entry point}: address of the other network (mainnet), (testnet) | green |
| Invoice of another network | Unit | `route` › {network}: an Invoice of the other network → otherNetworkInvoice | green |
| Invoice of another network | Unit | `route` › {network}: a Testnet3 Invoice → otherNetworkInvoice (the app testnet is Breez Regtest) | green |
| Invoice of another network | Integration | `entry` › {entry point}: Invoice of another network (Regtest on mainnet), (Bitcoin on testnet); Invoice on Regtest (testnet) is accepted | green |
| Lightning format while Breez is not started | Unit | `route` › {network}: every Lightning format without the Breez parse → lightningNotReady | green |
| Lightning format while Breez is not started | Integration | `entry` › {scanner, both paste screens}, Breez not started: {each Lightning format} gives the "starting" error (`/payment-input` waits instead, see P2-19) | green |
| Anything else (BOLT12) | Unit | `route` › {network}: bolt12offer → unsupported | green |
| Anything else (Spark address) | Unit | `route` › {network}: sparkaddress → unsupported | green |
| Anything else (silent payment address) | Unit | `route` › {network}: silentpayment → unsupported | green |
| Anything else (URL) | Unit | `route` › {network}: https://example.com → unsupported | green |
| Anything else (unknown text) | Unit | `route` › {network}: unknown text (the Breez parse rejects it) → unsupported | green |
| Anything else | Integration | `entry` › {entry point}: BOLT12 offer; unknown text; invalid Bitcoin URI | green |

### Items

| Item | Level | Test file › test name | Status |
| --- | --- | --- | --- |
| P2-1 | Integration | `entry` › the four entry points × the table above (21 cases each) | green |
| P2-2 | Unit | `route` › order of the rules › trims the Payment Input | green |
| P2-2 | Unit | `route` › order of the rules › removes a leading lightning:, LIGHTNING:, LiGhTnInG: before the Breez parse | green |
| P2-2 | Integration | `entry` › {entry point}: lightning:<Invoice> in any case | green |
| P2-3 (empty) | Unit | `route` › order of the rules › an empty or blank Payment Input → empty, without the Breez parse | green |
| P2-3 (empty) | Integration | `entry` › {Lightning, on-chain} paste screen › an empty Payment Input shows its own message, without the Breez parse | green |
| P2-3 (empty) | Integration | `link-route` › an empty link shows the "unsupported" error | green |
| P2-3 (order) | Unit | `route` › order of the rules › a Bitcoin URI never reaches the Breez parse, even when Breez is started | green |
| P2-3 (order) | Unit | `route` › order of the rules › a plain address never reaches the Breez parse, even when Breez is started | green |
| P2-3 (order) | Unit | `route` › order of the rules › text that is not a Bitcoin address for either network goes to the Breez parse | green |
| P2-5 | Integration | `entry` › scanner › shows the error as a flash message, then scans again after the 3-second pause | green |
| P2-5 | Integration | `entry` › scanner › an unknown QR code never navigates | green |
| P2-5 | Integration | `entry` › {Lightning, on-chain} paste screen › shows the error as a flash message and keeps the input | green |
| P2-5 | Integration | `link-route` › Back runs dismissAll then replace('/') (the error with its Back button) | green |
| P2-6 | Integration | `entry` › {entry point}: each destination is reached with `push` (scanner, paste screens) or `replace` (`/payment-input`), never the other | green |
| P2-6 | Integration | `entry` › scanner › pushes the destination; `link-route` › replaces itself with the destination, never pushes | green |
| P2-7 | Unit | `uri` › matches bitcoin: and BITCOIN: | green |
| P2-7 | Unit | `uri` › returns null for text that is not a Bitcoin URI | green |
| P2-7 | Unit | `uri` › the address is the part before ? | green |
| P2-7 | Unit | `uri` › an empty address is valid only with lightning= | green |
| P2-7 | Unit | `uri` › parameter names match in any case | green |
| P2-7 | Unit | `uri` › percent-decodes the values; an invalid percent-encoding makes the URI invalid | green |
| P2-7 | Unit | `uri` › amount 1, 0.0001, 0.00000001 and 21000000 give 100000000, 10000, 1 and 2100000000000000 sats | green |
| P2-7 | Unit | `uri` › converts 0.3, 1.15, 0.29, 20999999.99999999, 0.10000000 and 1. BTC without float rounding | green |
| P2-7 | Unit | `uri` › amount "0", "0.0", "-1", "1e-8", "0.000000001", "1,5", ".", "", " 1", "0x10", "1.2.3" makes the URI invalid | green |
| P2-7 | Unit | `uri` › an unknown req- parameter makes the URI invalid, in any case; a parameter without = is ignored, unless it is a req- parameter | green |
| P2-7 | Unit | `uri` › label, message and other unknown parameters are ignored | green |
| P2-7 | Unit | `uri` › when a parameter appears twice, the first one wins (amount, lightning); … even when the second one is invalid, but never hides a req- parameter | green |
| P2-7 | Unit | `route` › {network}: an invalid Bitcoin URI → unsupported | green |
| P2-7 | Unit | `route` › {network}: a Bitcoin URI with an address of the other network → otherNetworkAddress | green |
| P2-8 | Integration | `entry` › {entry point}: Lightning routes the lightning= value | green |
| P2-8 | Integration | `entry` › {entry point}: on-chain keeps the address and the URI's amount | green |
| P2-8 | Integration | `entry` › {entry point}: Lightning with a value that is not a Lightning format → unsupported | green |
| P2-8 | Integration | `entry` › scanner › does not scan while the method sheet is open, and scans again once it is closed without a choice | green |
| P2-8 | Integration | `entry` › {Lightning, on-chain} paste screen › closing the method sheet keeps the input and does not navigate | green |
| P2-8 | Integration | `link-route` › closing the method sheet runs dismissAll then replace('/') | green |
| P2-8 | Integration | `sheet` › closing it without a choice calls onDismiss; choosing lightning / onchain calls onSelect and never onDismiss; a choice does not hide a later close | green |
| P2-8 | Integration | `hook` › a method choice without a Bitcoin URI waiting for it does nothing | green |
| P2-9 | Unit | `route` › {network}: bitcoin:?lightning=… → the Lightning route, no chooseMethod | green |
| P2-9 | Integration | `entry` › {entry point}: bitcoin:?lightning=<Invoice> (no sheet) | green |
| P2-10 | Integration | `onchain-amount` › amountSats=10000 shows 10000 in SATS | green |
| P2-10 | Integration | `onchain-amount` › amountSats=10000 shows 0.0001 in BTC | green |
| P2-10 | Integration | `onchain-amount` › the pre-filled Amount can be changed, and Continue sends the changed Amount with the chosen Network Fee | green |
| P2-10 | Integration | `onchain-amount` › an invalid amountSats is ignored | green |
| P2-11 | Unit | `address` › validates addresses with BDK for Network.Bitcoin on mainnet and Network.Testnet on testnet; accepts uppercase; refuses text that is not an address | green |
| P2-11 | Unit | `src/lib/bdk/__tests__/*`, `src/lib/context/__tests__/bdk-context.test.tsx` › pass with the stricter `mock-bdk-rn` Address | green |
| P2-12 | Unit | `route` (rows "Invoice of another network" above) | green |
| P2-13 | Unit | `route` › {network}: an expired Invoice is routed normally | green |
| P2-13 | Integration | `details` › an expired Invoice shows "This invoice has expired" (already the behaviour, kept) | green |
| P2-14 | Unit | `route` › {network}: the Breez results BitcoinAddress and Bip21 → unsupported | green |
| P2-14 | Unit | `route` › {network}: an address and a Bitcoin URI without lightning= are routed while Breez is not started; a Bitcoin URI with lightning= still → chooseMethod | green |
| P2-14 | Integration | `entry` › {entry point}: Breez not started, a plain address / a Bitcoin URI without lightning= still reaches send-onchain/enter-amount | green |
| P2-14 | Integration | `entry` › {entry point}: Breez not started, the sheet still shows and Lightning gives the "starting" error | green |
| P2-14 | Unit | `route` › {network}: routeLightningInput (the Lightning choice of the method sheet): only the Lightning rows | green |
| P2-15 | Integration | `ln-amount` › Invoice without an Amount: "Send to" shows the description | green |
| P2-15 | Integration | `ln-amount` › Invoice without an Amount: "Send to" shows "Lightning invoice" without a description | green |
| P2-15 | Integration | `ln-amount` › Invoice without an Amount: any Amount above 0 is accepted, with no limits message | green |
| P2-15 | Integration | `ln-amount` › Invoice without an Amount: Continue opens transaction-details with rawInvoice and amountSats | green |
| P2-15 | Integration | `ln-amount` › an Invoice that has its own Amount shows preparePaymentFailed | green |
| P2-16 | Integration | `details` › rawInvoice + amountSats: prepareSend(bolt11, amountSats), shows that Amount, the fee and the Total | green |
| P2-16 | Integration | `details` › rawInvoice + amountSats: the expiry countdown is shown | green |
| P2-16 | Integration | `details` › rawInvoice + amountSats: `Completed` opens the success screen (Part 1 outcomes apply) | green |
| P2-16 | Integration | `details` › amountSats with an Invoice that has its own Amount shows invalidData and never calls prepareSend | green |
| P2-16 | Integration | `details` › rawInvoice + an invalid amountSats (0, -5, abc) shows invalidData | green |
| P2-17 | Unit | `deep-link` › lightning:, LIGHTNING:, bitcoin:, BITCOIN:, Bitcoin: become /payment-input?input=<encoded URL> | green |
| P2-17 | Unit | `deep-link` › the encoded URL survives a round trip (?, &, =, %) | green |
| P2-17 | Unit | `deep-link` › leaves /settings, /(app), GrimmApp://…, https://…, lnurlw://…, bitcoincash:… and "" to the router (null) | green |
| P2-17 | Unit | `intent` › sends lightning: and bitcoin: links in any case to /payment-input; leaves the other paths; falls back to /(app) when the path cannot be read | green |
| P2-18 | Unit | `schemes` › app.config registers bitcoin and lightning on iOS and Android, and no LUD-17 scheme; the Android intent filters open links from the browser | green |
| P2-18 | Unit | `schemes` › the committed AndroidManifest.xml and Info.plist register bitcoin | green |
| P2-19 | Integration | `link-route` › without a Recovery Phrase, replaces with / once the data is loaded | green |
| P2-19 | Integration | `link-route` › waits for the data to be loaded | green |
| P2-19 | Integration | `link-route` › shows "Reading…" while it routes | green |
| P2-19 | Integration | `link-route` › Breez starting, then started: routes once Breez is ready, once | green |
| P2-19 | Integration | `link-route` › breezError with a Lightning format shows "could not start" with Back; Breez fails while the link waits for it | green |
| P2-19 | Integration | `link-route` › breezError with an on-chain Bitcoin URI still routes | green |
| P2-19 | Integration | `link-route` › Back runs dismissAll then replace('/'); closing the method sheet does the same | green |
| P2-20 | Integration | `entry` › {entry point}: every case of the table checks that executeSend and executeLnurlPay are never called | green |
| P2-20 | Integration | `lock-screen` › a screen opened behind the Lock Screen (link, notification) is shown after unlocking (existing) | green |
| Scanner screen | Integration | `scanner` › asks for the permission; waits for the answer; offers to open the settings; switches the camera and the flash; Close; a second QR code while the first one is read is ignored | green |
| testIDs | Integration | `link-route`, `entry`, `ln-amount`, `onchain-amount` select by `payment-input-screen`, `payment-input-loading`, `payment-input-error`, `payment-input-back`, `send-method-lightning`, `send-method-onchain`, `send-ln-amount-send-to`, `send-onchain-amount-value` | green |
| Translations | Unit | `i18n` › EN and FR have the same Part 2 keys, with the spec copy; the keys Part 2 replaces are gone from EN and FR | green |

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
| 2 | `.maestro/send-lightning.yaml` (changed) | P2-4 (address of the app's network pasted on the Lightning screen), P2-1 | not run locally (syntax checked); runs in `e2e-android` on the PR |
| 2 | `.maestro/send-onchain.yaml` (changed) | P2-4 ("unsupported" message) | not run locally (syntax checked); runs in `e2e-android` on the PR |
| 2 | `.maestro/send-routing.yaml` (new) | P2-4, P2-7, P2-8, P2-9, P2-10, P2-11, P2-12, P2-13, P2-15 | not run locally (syntax checked); runs in `e2e-android` on the PR |
| 2 | `.maestro/deep-links.yaml` (new) | P2-17, P2-18, P2-19 | not run locally (syntax checked); runs in `e2e-android` on the PR |
| 3 | — | no stable LNURL-withdraw service (decided with the user) | manual checklist |
| 4 | `.maestro/lightning-login.yaml` (new) | P4-1, P4-2 (`register`, no action), P4-3 (Cancel) | planned |

Part 2, not run locally: the arm64 emulator `Medium_Phone_API_36.0` (no screen lock) refused even the arm64-only release APK (73 MB) with `INSTALL_FAILED_INSUFFICIENT_STORAGE`, at 525 MB free; the user chose to leave it as it is. `maestro check-syntax` passes on every new or changed flow and subflow. The `send-lightning-address` flow also needs `admin-test@pay.usegrimm.app` to be registered (it answered 404 on 2026-11-01).

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

### Part 2

| Mutation | Caught by |
| --- | --- |
| Evaluation order: the Breez parse before the BDK check | `route` › a Bitcoin URI never reaches the Breez parse…; a plain address never reaches the Breez parse…; an address of the other network → otherNetworkAddress (both networks); `entry` › on-chain keeps the address and the URI's amount (3 entry points) (8 tests) |
| Testnet mapping: `Regtest` replaced by `Testnet3` | `route` › testnet: a Testnet3 Invoice → otherNetworkInvoice, an Invoice of the other network…; `entry` › Invoice on Regtest (testnet) (4 entry points) (10 tests) |
| `req-` rule removed | `uri` › an unknown req- parameter makes the URI invalid…; a parameter without = …; … never hides a req- parameter; `route` › an invalid Bitcoin URI → unsupported (5 tests) |
| First-wins rule: the last parameter wins | `uri` › when a parameter appears twice, the first one wins; … even when the second one is invalid (2 tests) |
| BTC to sats with a float, truncated (`Math.trunc(Number(amount) * 1e8)`) | `uri` › converts 1.15 BTC …; converts 0.29 BTC … (2 tests) |
| BTC to sats with a float, rounded (`Math.round(Number(amount) * 1e8)`) | none: equivalent mutant within the valid range (0 mismatches on 1 000 000 random 8-decimal amounts up to 21 000 000 BTC) |
| `push` instead of `replace` in `/payment-input` | `entry` › every `/payment-input` destination; `link-route` › replaces itself with the destination… (19 tests) |
| `replace` instead of `push` in the scanner | `entry` › every scanner destination, scanner › pushes the destination; `scanner` › a second QR code… (18 tests) |
| The method sheet reports a dismiss after a choice | `entry` › `/payment-input`: Lightning routes…, on-chain keeps…; `sheet` › choosing … never onDismiss (7 tests) |
| The scanner scans while the method sheet is open | `entry` › scanner › does not scan while the method sheet is open… |
| `/payment-input` does not wait for Breez | `link-route` › Breez starting, then started: routes once Breez is ready, once |
| `amountSats` accepted with an Invoice that has its own Amount | `details` › amountSats with an Invoice that has its own Amount shows invalidData… |
| On-chain `amountSats` not pre-filled | `onchain-amount` › amountSats=10000 shows 10000 in SATS, 0.0001 in BTC; the pre-filled Amount can be changed… (3 tests) |
| An Invoice without an Amount loses its Amount on Continue | `ln-amount` › Invoice without an Amount: Continue opens transaction-details with rawInvoice and amountSats |
| `bitcoin:` links not redirected | `deep-link` and `intent` › the bitcoin:/BITCOIN: cases (6 tests) |
| Every other Breez result routed as `lightningAmount` (the "unsupported" rows) | `route` › LNURL-withdraw, LNURL-auth, BOLT12, Spark, silent payment, URL, BitcoinAddress/Bip21, routeLightningInput (both networks); `entry` › BOLT12, LNURL-withdraw, LNURL-auth, Lightning with a non-Lightning value (4 entry points) (32 tests) |
