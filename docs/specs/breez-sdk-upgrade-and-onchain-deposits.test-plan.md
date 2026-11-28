# Test plan: Breez SDK upgrade and on-chain deposits

Traceability from [the spec](./breez-sdk-upgrade-and-onchain-deposits.md) to the automated tests. Levels: **Unit** (Jest, pure functions in `src/lib/…`), **Integration** (Jest, real provider, hook or screen, with only the SDK and native modules faked), **E2E** (Maestro, `.maestro/`), **Build** (native compile).

The deposit and claim tests share `src/lib/breez/__tests__/helpers/fake-breez-sdk.ts`, a stand-in for the SDK module with the 0.28.6 enum values and builders (`fakeDeposit`, `settled`, `submitted`, `deferred`, `sdkError`).

Short names: `deposits`, `sdk-logs`, `sync`, `log` = `src/lib/breez/__tests__/{deposits,sdk-logs,wallet-sync,unclaimed-deposits-log}.test.ts`; `ctx` = `src/lib/context/__tests__/breez-context.test.tsx`; `hook` = `src/lib/hooks/__tests__/use-unclaimed-deposits.test.ts`; `screen` = `src/app/wallets/__tests__/unclaimed-deposits.test.tsx`; `item` = `src/components/__tests__/transaction.test.tsx`; `tab` = `src/app/(app)/__tests__/transactions.test.tsx`; `ln` = `src/app/wallets/__tests__/ln-wallet-details.test.tsx`; `utils` = `src/lib/__tests__/utils-onchain.test.ts`; `dev` = `src/app/settings/developers/__tests__/breez-sdk.test.tsx`.

**Status:**

- **green**: the test passes.
- **killed**: the test was also seen red against a deliberate mutation of the code, then green again.
- **E2E: run** or **not run** depends on whether the flow was executed against a release build on an arm64 emulator.

## Part 1: SDK upgrade

| Item | Level       | Test                                                                                      | Status                |
| ---- | ----------- | ----------------------------------------------------------------------------------------- | --------------------- |
| P1-1 | Build       | `pnpm type-check` against the 0.28.6 bindings                                             | green                 |
| P1-1 | Build       | Android release build (arm64) and iOS simulator build                                     | green                 |
| P1-2 | Integration | `ctx` › sends what the user entered as a payment request input                            | green                 |
| P1-3 | Integration | `ctx` › creates an invoice without a caller preimage or receiver key                      | green                 |
| P1-4 | Unit        | `sync` › resolves false when the SDK reports that the sync could not refresh the balances | killed                |
| P1-5 | Integration | `ctx` › shows the deposits the SDK stored (stale-closure fix)                             | green                 |
| P1-6 | Integration | `ctx` › wallet balance suite (stored balance, sync on refresh, on new payment, on return) | green                 |
| P1-7 | E2E         | full Maestro suite on the release build                                                   | run: 26/30, see below |

## Part 2: SDK logs

| Item | Level       | Test                                                                                                                                        | Status     |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| P2-1 | Integration | `ctx` › starts the SDK logs before connecting, in the app documents                                                                         | green      |
| P2-1 | Unit        | `sdk-logs` › creates the log folder and has the SDK write there with its default filter                                                     | green      |
| P2-2 | Unit        | `sdk-logs` › starts the SDK logs once per app process                                                                                       | green      |
| P2-2 | Unit        | `sdk-logs` › never throws when the SDK refuses to log                                                                                       | green      |
| P2-3 | Unit        | `sdk-logs` › rotateSdkLog › keeps a log below the size limit / keeps a full log as the previous one / does nothing when there is no log yet | green      |
| P2-4 | Unit        | `sdk-logs` › shares one text file: the header, then the previous and the current log, oldest first                                          | green      |
| P2-4 | Unit        | `sdk-logs` › shares the current log alone when there is no previous log                                                                     | green      |
| P2-4 | Unit        | `sdk-logs` › reports empty logs / a device without sharing                                                                                  | green      |
| P2-5 | Unit        | `sdk-logs` › names what Breez support asks for / states the SDK version installed by package.json                                           | green      |
| P2-6 | Integration | `dev` › explains what the logs contain; shares the logs with the header; says so when nothing to share; reports a failed export             | green      |
| P2-7 | E2E         | `settings-about` › Export SDK logs opens the share sheet without an error message                                                           | run: green |

## Part 3: Automatic claim limit

| Item | Level       | Test                                                                                      | Status |
| ---- | ----------- | ----------------------------------------------------------------------------------------- | ------ |
| P3-1 | Unit        | `deposits` › claims automatically up to 500 sats plus 0.1% of the deposit                 | green  |
| P3-1 | Integration | `ctx` › claims deposits automatically up to 500 sats plus 0.1%                            | killed |
| P3-2 | Unit        | `deposits` › caps a manual claim at the fee the user approved, with no proportional share | green  |
| P3-2 | Integration | `ctx` › claims for at most the approved fee, then reports a payment still pending…        | green  |

## Part 4: Deposits in the lists and the deposits screen

| Item | Level       | Test                                                                                                       | Status     |
| ---- | ----------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| P4-1 | Unit        | `deposits` › getDepositState (8 tests, one per state and precedence)                                       | green      |
| P4-2 | Unit        | `deposits` › offers a manual claim only for deposits waiting for the fee approval                          | green      |
| P4-2 | Unit        | `deposits` › hides the deposits whose credit is already a payment, and keeps the others                    | green      |
| P4-3 | Unit        | `utils` › lists the deposits not credited yet first / maps a deposit to a pending receive                  | green      |
| P4-3 | Integration | `tab` › lists a deposit not credited yet first, and never a credited one                                   | killed     |
| P4-3 | Integration | `tab` › keeps the deposit in the Lightning and Pending filters only (4 filters)                            | green      |
| P4-3 | Integration | `ln` › lists the deposits not credited yet with the payments                                               | green      |
| P4-4 | Integration | `item` › shows a deposit not credited yet with its state instead of a date                                 | green      |
| P4-4 | Integration | `item` › opens the deposits screen when a deposit is pressed                                               | green      |
| P4-4 | Integration | `item` › still shows a payment with its date and status, and opens its details                             | green      |
| P4-5 | Integration | `screen` › says when no deposit is in progress                                                             | green      |
| P4-5 | Integration | `screen` › lists every deposit not credited yet with its state, and hides the credited ones                | green      |
| P4-5 | Integration | `screen` › offers a claim only for a deposit waiting for the fee approval, with the fee and the net amount | green      |
| P4-5 | Integration | `screen` › claims after the user confirms the fee… / does not claim when the user cancels                  | green      |
| P4-6 | Unit        | `log` › lists each deposit with its amount, state and truncated outpoint; names every state; logs…         | green      |
| P4-7 | E2E         | `deposits` › no deposit row or claim banner; empty deposits screen through its link                        | run: green |

## Part 5: Claim result

| Item | Level       | Test                                                                                                                    | Status |
| ---- | ----------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| P5-1 | Unit        | `deposits` › reports a credit when the claim settled with a completed payment                                           | green  |
| P5-2 | Unit        | `deposits` › reports the credit as on its way when the settled payment is still pending (the stuck-deposit case)        | killed |
| P5-2 | Integration | `ctx` › claims for at most the approved fee, then reports a payment still pending as on its way and syncs               | killed |
| P5-2 | Integration | `hook` › never announces a credit while the payment is still pending                                                    | green  |
| P5-3 | Unit        | `deposits` › reports the credit as on its way when an early claim was submitted                                         | green  |
| P5-4 | Unit        | `deposits` › reports the new fee when the claim was deferred over the fee; reports nothing claimed yet…                 | green  |
| P5-5 | Unit        | `deposits` › claimErrorToResult (expected errors become answers, others are left to the caller)                         | green  |
| P5-5 | Integration | `ctx` › answers a claim already running; reports the new fee and refreshes the deposits; rejects on an unexpected error | green  |
| P5-6 | Integration | `hook` › tells the user what the claim did (7 cases) / reports an unexpected error                                      | green  |
| P5-7 | Integration | `ctx` › …syncs to finish it (a sync starts after the claim)                                                             | killed |

## E2E run (November 28, 2026)

Development release build (JS embedded, SDK 0.28.6), local arm64 emulator API 36 `google_apis_playstore` with 4 cores and 4 GB (`grimm_e2e`), Maestro 2.10.0 (the CI version), `MAESTRO_DRIVER_STARTUP_TIMEOUT=180000`. With 1 core, the emulator dropped its adb connection as soon as the Maestro driver started.

- **26 of 30 flows passed**, including every flow that uses Breez: invoices, Lightning Address, Payment Input routing, links, Lightning Login, network switch, Breez SDK details and log export, deposits. Logcat shows no crash or ANR from the app.
- **The 4 failures come from the environment, not from this change:**
  - `send-onchain`, `settings-esplora`, `receive-onchain` (BDK part): the default Esplora indexer `mempool.bitdevsyde.org` answered HTTP 530 during the run, while `mempool.space` and `blockstream.info` answered 200. The fee estimation waits for a synced on-chain wallet, and `settings-esplora` expects the default indexer in use. BDK code is unchanged.
  - `receive-lightning` and `receive-onchain`: on this Play Store image, Android 16's clipboard overlay sits where the next tap lands after a copy, and opens "Set up Quick Share" over the app. The CI image (`google_apis`, API 35) has no Quick Share.
- A local copy of the flows that closes the Quick Share screen ran green for `receive-lightning`: invoice created, then pasted, then decoded, then "Your balance is insufficient", which covers `prepareSend` with `PaymentRequest.Input`. It also ran green for the Breez part of `receive-onchain`: the Lightning account deposit address.
- iOS: Debug simulator build (iPhone 17 Pro, iOS 26), with a wallet created through Maestro. Breez 0.28.6 connected ("Connected to …"). `Documents/breez-sdk-logs/sdk.log` was written at DEBUG level (operator connections, sync), and it contains no secret: there is no run of 12 BIP39 words, the longest is 4.
- To do before merging: run `e2e-android.yml` on the branch once the default indexer is back up.
