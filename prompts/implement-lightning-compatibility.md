# Implement Lightning compatibility

You implement [docs/specs/lightning-compatibility.md](../docs/specs/lightning-compatibility.md) in four parts, one pull request each, in order: Part 1 (reliable Lightning send), Part 2 (Payment Input routing), Part 3 (Withdrawal), Part 4 (Lightning Login).

Sources of truth, in this order:

- **The spec** for behaviour. Its numbered items are the contract: `P1-1`…`P1-5`, `P2-1`…`P2-20`, `P3-1`…`P3-6`, `P4-1`…`P4-6`. Its "testIDs", "Translations", "Maestro" and "Manual checklist" sections are part of the contract too.
- **[GLOSSARY.md](../GLOSSARY.md)** for vocabulary. Use its terms in identifiers, test names and UI copy: `Payment Input`, `Invoice`, `Bitcoin URI`, `Withdrawal`, `Lightning Login`, `Amount`, `Total`…
- **[AGENTS.md](../AGENTS.md)** for repository conventions, commands, the Jest rules (stable `mockT`, stable `mockRouter`, mocking Breez and BDK, `mock`-prefixed factory variables) and the Maestro rules. Read its "Unit tests (Jest)" and "E2E tests (Maestro)" sections before writing any test.
- **[.maestro/README.md](../.maestro/README.md)** before writing a flow.

When the spec is silent, or contradicts the code, stop and ask the user, with the answer you recommend. Record the answer in the spec before coding it.

Leave every change in the working tree: the user reviews and commits at each checkpoint.

## Branches

Before each part, create its branch:

| Part | Branch                         | Starts from                                                                  |
| ---- | ------------------------------ | ---------------------------------------------------------------------------- |
| 1    | `feat/reliable-lightning-send` | `master` if #254 is merged, otherwise `feat/app-lock-and-onchain-amount-fix` |
| 2    | `feat/payment-input-routing`   | `master` if Part 1's pull request is merged, otherwise Part 1's branch       |
| 3    | `feat/withdrawal`              | `master` if Part 2's pull request is merged, otherwise Part 2's branch       |
| 4    | `feat/lightning-login`         | `master` if Part 3's pull request is merged, otherwise Part 3's branch       |

Check with `gh pr view <number> --json state` or `gh pr list --head <branch>`. Start a part only once the previous part is committed.

## How to work

Work test-first, one spec item at a time:

1. Write the test for the item.
2. Run it and watch it go **red** for the reason the item describes. A test that is red because of a typo or a missing import does not count.
3. Write the smallest code that turns it **green**.
4. Refactor while it stays green.

Run single files with `pnpm test <path>` while iterating.

## Test levels

Every test belongs to one level. Name the level in the traceability table.

- **Unit (Jest)**: pure functions, no React: `amount-limits`, `parseBitcoinUri`, `routePaymentInput`, `toPaymentInputPath`, the URL host helper. `routePaymentInput` takes its dependencies (app network, BDK address validation, Breez parse) as an argument, so its tests need neither Breez nor React.
- **Integration (Jest)**: the real screens, the real `usePaymentInput` hook and the real `src/lib/payment-input` logic, rendered together. Fake only the boundaries:
  - `@/lib/context/breez-context`: a controllable fake of `useBreez()` (`parseInput`, `prepareSend`, `executeSend`, `prepareLnurlPay`, `executeLnurlPay`, `lnurlWithdraw`, `lnurlAuth`, `isBreezInitialized`, `breezError`, `network`, `balance`), plus the `InputType_Tags` and `PaymentStatus` values. AGENTS.md explains why the Breez SDK itself is never imported in tests.
  - `bdk-rn`: `src/lib/bdk/__tests__/helpers/mock-bdk-rn`. Its `Address` accepts any string today. Extend it so `new Address(address, network)` throws for an address of the other network (`bc1…` is `Network.Bitcoin`, `tb1…` is `Network.Testnet`) and for an invalid address, then run the existing BDK tests to check they still pass.
  - `expo-router` with a stable `mockRouter`; `expo-camera` with a `CameraView` that captures its `onBarcodeScanned` prop, so a test can "scan" a Payment Input.
  - the usual inline mocks AGENTS.md lists (safe area, icons, status bar, `react-i18next` with a stable `mockT`).

  Put the shared fakes and a builder for Breez parse results (an Invoice with or without an Amount, on a given network; a Lightning Address; LNURL-pay, -withdraw and -auth) in `src/lib/payment-input/__tests__/helpers/`, the way `src/lib/app-lock/__tests__/helpers/` serves the App Lock tests.

- **E2E (Maestro)**: the flows the spec's "Maestro" section lists, in `.maestro/`, using the testIDs the spec lists.

## Step 1: traceability table

Read the spec, the glossary and the existing tests you will extend:

- `src/app/send/__tests__/enter-address.test.tsx`, `enter-amount.test.tsx`, `transaction-details.test.tsx`
- `src/app/send-onchain/__tests__/enter-amount.test.tsx`
- `src/lib/lightning/__tests__/deep-link.test.ts`
- `src/lib/bdk/__tests__/helpers/mock-bdk-rn.ts`

Then create `docs/specs/lightning-compatibility.test-plan.md`, in the format of [onchain-amount-fix-and-app-lock.test-plan.md](../docs/specs/onchain-amount-fix-and-app-lock.test-plan.md): one section per part, one row per test, with item, level, test file › test name, and status.

This step is done when every item from `P1-1` to `P4-6`, and every row of the spec's tables (the routing table, the outcome tables, the Lightning Login titles), has at least one planned automated test that would go red if it were broken. An item that one test covers only in part gets more rows until the whole item is covered. The manual checklist is extra, for real services and real hardware; it never replaces an automated test. Keep the table up to date as you go: it is the backbone of each report.

## Step 2: Part 1, reliable Lightning send

Follow the spec's Part 1 "Changes". The tests must pin down:

- **Outcomes.** Each row of the outcome table, for an Invoice and for a Lightning Address: `Completed` reaches the success screen with the payment's Amount, `Pending` reaches the pending screen in `sent` mode, `Failed`, `undefined` and a rejection show the send error without navigating.
- **Retry.** After a failure, the slider works again, and a second slide calls the SDK again with the same prepared payment object.
- **Pending screen.** Both modes, and OK running `dismissAll` then `replace('/')`.
- **Limit boundaries.** 1 500 msat gives a 2 sat minimum and 1 999 msat a 1 sat maximum. Continue is disabled at min − 1 and max + 1, and enabled at min and max, in sats and in BTC. Equal limits pre-fill the amount. Continue is disabled while the parse is pending and after it fails.

Part 1 is done when:

- every `P1-*` row is green;
- `pnpm lint`, `pnpm type-check`, `pnpm lint:translations` and `pnpm test` pass;
- **the rules have been seen red**: change each of these one at a time, check that at least one test fails each time, then restore it:
  - treating `Pending` as `Completed`;
  - removing the `catch`;
  - `ceil` and `floor` swapped in the limit conversion;
  - `<` instead of `<=` at each limit.

**Checkpoint.** Stop and report Part 1 to the user (format below), then wait. The user commits it and may open its pull request before you start Part 2.

## Step 3: Part 2, Payment Input routing

Follow the spec's Part 2 "Changes", bottom-up, each layer green before the next:

1. `parseBitcoinUri`, then `routePaymentInput`.
2. `usePaymentInput`, and the `onDismiss` prop of `PaymentMethodBottomSheet`.
3. The four entry points: the scanner, both paste screens, `/payment-input`.
4. `send/enter-amount`, `send/transaction-details` and `send-onchain/enter-amount` changes.
5. `toPaymentInputPath`, `+native-intent.tsx`, the `bitcoin` scheme.
6. Translations, testIDs, removal of the unused keys.

**Native projects.** `pnpm prebuild:development` needs `.env.development` and `credentials/firebase/google-services.json` (see AGENTS.md). Then run `git diff --stat android ios`. Keep only the `bitcoin` scheme in `Info.plist` and `AndroidManifest.xml`, and restore every other file. If prebuild cannot run here, add those lines by hand and tell the user.

The tests must pin down these cases, which are the easiest to get wrong:

- **One table, four entry points.** A single list of Payment Inputs, each with its expected destination (pathname and params) or error, played against the scanner, the Lightning paste screen, the on-chain paste screen and `/payment-input`. The list covers every row of the routing table. A new row added to the list later must run against all four without new test code.
- **Evaluation order.** A plain address and a Bitcoin URI never call the Breez parse, even when Breez is started. `lightning:` and `LIGHTNING:` prefixes are removed before the Breez parse.
- **Breez not started.** A plain address and a Bitcoin URI without `lightning=` still reach the on-chain amount screen. Every Lightning format gives the "starting" error. A Bitcoin URI with `lightning=` still presents the sheet; choosing Lightning gives the "starting" error.
- **Networks, on both app networks.** `bc1…` on testnet and `tb1…` on mainnet give the address error. An Invoice on `Regtest` is accepted on testnet and refused on mainnet; an Invoice on `Bitcoin` the other way round. An Invoice on `Testnet3` is refused on both: the app's testnet is Breez Regtest.
- **Breez results for on-chain formats.** `BitcoinAddress` and `Bip21` from the Breez parse give "unsupported".
- **Bitcoin URI amounts.** `0.00000001` gives 1 sat and `21000000` gives 2 100 000 000 000 000 sats, with no float rounding (check `0.1 + 0.2`-style values such as `0.3` and `1.15`). `0`, `-1`, `1e-8`, `0.000000001`, `1,5` and `.` make the URI invalid, and so does an unknown `req-` parameter. When a parameter appears twice, the first one wins.
- **Sheet.** Choosing Lightning routes the `lightning=` value; choosing on-chain keeps the URI's amount. Closing the sheet: the scanner scans again, a paste screen keeps its input, `/payment-input` goes home. `bitcoin:?lightning=…` skips the sheet.
- **Scanner.** After an error it scans again (after the 3-second pause), and an unknown QR code never navigates.
- **Invoice without an Amount.** "Send to" shows the description, or "Lightning invoice". `send/transaction-details` calls `prepareSend(bolt11, amountSats)` and shows that Amount. `amountSats` with an Invoice that has its own Amount shows the invalid-data error and never calls `prepareSend` with it.
- **Pre-filled on-chain amount.** `amountSats=10000` shows `10000` in sats and `0.0001` in BTC, and the user can change it.
- **`/payment-input`.** No Recovery Phrase replaces with `/`. Breez starting, then started: it routes once Breez is ready. `breezError` with a Lightning format shows the "could not start" error; with an on-chain URI it still routes. It replaces itself with the destination (`replace`, never `push`).
- **Links.** `lightning:` and `bitcoin:` in any case become `/payment-input?input=<encoded URL>`, and the encoded URL survives a round trip (`?`, `&`, `=`, `%`). Other paths do not change.

Part 2 is done when:

- every `P2-*` row is green, at the level the table names;
- `pnpm lint`, `pnpm type-check`, `pnpm lint:translations` and `pnpm test:ci` pass;
- the coverage that `pnpm test:ci` writes to `coverage/coverage.txt` is **at least 95 %** lines and branches for `src/lib/payment-input/**`, `src/lib/lightning/**` and `src/lib/hooks/use-payment-input.ts`, and **at least 85 %** for the screens Part 2 creates or changes;
- **the rules have been seen red**: change each of these one at a time, check that at least one test fails each time, then restore it:
  - the evaluation order (the Breez parse before the BDK check);
  - the testnet mapping (`Regtest` replaced by `Testnet3`);
  - the `req-` rule;
  - the first-wins rule for a duplicated parameter;
  - the BTC-to-sats conversion done with a float;
  - `push` instead of `replace` in `/payment-input`, and `replace` instead of `push` in the scanner;
- the Maestro flows have run (see "Maestro" below).

**Checkpoint.** Stop, report Part 2, and wait.

## Step 4: Part 3, Withdrawal

Follow the spec's Part 3 "Changes". The tests must pin down:

- the domain of `callback` URLs with a port, a path, a query string and a subdomain, and an invalid URL;
- equal limits show the Amount without a keypad; a range is pre-filled with the maximum; the limit boundaries, as in Part 1;
- each row of the outcome table, including no `Payment` after 60 s;
- `lnurlWithdraw` receives the Amount in sats and `completionTimeoutSecs: 60`;
- a double tap on Withdraw calls `lnurlWithdraw` once, and a retry after an error calls it again;
- LNURL-withdraw now reaches `receive/withdrawal` from the four entry points (the table of Part 2 gets its row).

Part 3 is done when every `P3-*` row is green, the checks of Part 2 pass with the same coverage thresholds (add `src/app/receive/withdrawal.tsx` to the 85 % group), and these mutations have been seen red: the pre-fill with the minimum instead of the maximum; `Pending` treated as `Completed`; the 60 s timeout removed.

**Checkpoint.** Stop, report Part 3, and wait.

## Step 5: Part 4, Lightning Login

Follow the spec's Part 4 "Changes". The tests must pin down:

- the three titles, including an `action` the spec does not list, which gets "Sign in to {{domain}}?";
- `lnurlAuth` is never called on mount, nor after Cancel, and is called exactly once per tap on Sign in;
- `Ok`, `ErrorStatus` with its reason in the message, and a rejection; a retry after an error;
- LNURL-auth now reaches `lightning-login` from the four entry points.

Part 4 is done when every `P4-*` row is green, the checks of Part 2 pass with the same coverage thresholds (add `src/app/lightning-login.tsx` to the 85 % group), and this mutation has been seen red: calling `lnurlAuth` in a mount effect.

Then update the docs the spec lists under "Docs to update", including the README tick, which waits for Part 4.

**Final report.** Report Part 4 and the overall state.

## Maestro

Each part writes and changes the flows of its own subsection of the spec's "Maestro" section, in that part, following `.maestro/README.md`. When a behaviour of a part can be reached without funds and the spec has no flow for it, propose one to the user and add it to the spec. Each part adds its new flows to the coverage table of `.maestro/README.md`. Take the Invoices from the BOLT 11 test vectors, as the spec says. If the Breez parse refuses an expired vector, stop and ask the user.

- If an arm64 device or emulator **without a screen lock** is available, run them against a release build, as AGENTS.md describes.
- Otherwise, say so in the report: they will run in the `e2e-android` workflow on the pull request.

## Report

Report at each checkpoint, in this order:

1. **What changed**, file by file, in one line each.
2. **The traceability table**: a link, plus any row of the part that is not green, and why.
3. **Commands run**, with their results: the test counts and, from Part 2 on, the coverage figures above.
4. **The red checks**: which mutations you made, and which test caught each one.
5. **The Maestro flows**: run (on which device, with the result) or not run.
6. **Deviations from the spec**, with the user's answer for each, and open questions.
