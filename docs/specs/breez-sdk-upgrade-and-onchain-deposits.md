# Spec: Breez SDK upgrade and on-chain deposits

Branch `feat/breez-sdk-upgrade-onchain-deposits`. Test plan: [breez-sdk-upgrade-and-onchain-deposits.test-plan.md](./breez-sdk-upgrade-and-onchain-deposits.test-plan.md).

## Context: the stuck deposit (November 2026)

A user sent bitcoin to the on-chain address of the Lightning wallet (a Breez/Spark static deposit address).

1. The SDK did not claim the Deposit automatically. Grimm did not set `maxDepositClaimFee`, and the SDK 0.15.1 default is 1 sat/vB × 99 vB, so 99 sats. The Spark Service Provider charges more than that, so the claim failed with `MaxDepositClaimFeeExceeded`, and almost every Deposit waits for a manual claim.
2. The user claimed it manually. The provider took the UTXO and sent a Spark transfer to the wallet. The SDK stored the payment as `Pending` and removed the Deposit from the unclaimed list. Grimm showed "Deposit credited successfully", because it ignored the returned payment.
3. The wallet then has to claim that incoming transfer. SDK 0.15.1 retries this at every sync and logs a failure with `warn!` only. Grimm did not write the SDK logs, so for 15 hours the payment stayed `Pending` and the balance unchanged, with no trace.
4. The user restored the Recovery Phrase in Glow (Breez's reference wallet, SDK 0.28.6), which claimed the transfer at once. Grimm then showed the right balance.

Most likely cause: 0.15.1 claims a transfer with three operator calls (`claim_transfer_tweak_keys`, `claim_transfer_sign_refunds_v2`, `finalize_node_signatures_v2`). In 0.16.0 Breez replaced them with one package-based `claim_transfer` call, after aligning on the current Spark protocol (spark-sdk commits `c7a6ba42` and `167b0b84`). 0.15.1 is a patch release of the old branch. This is not proven: no log exists.

## Part 1: SDK upgrade 0.15.1 → 0.28.6

### Version

The SDK moves from 0.15.1 to **0.28.6**, the version Glow runs and the one that claimed the stuck transfer. 0.29.0 came out the day of this change and was not chosen. The version is pinned exactly (`"0.28.6"`), because `patchedDependencies` is keyed on it.

- The SDK depends on Breez's fork of `uniffi-bindgen-react-native` (0.29.3-1 plus a `uint64_t` `RustBuffer` fix for 32-bit ARM).
- Grimm keeps the pnpm override to npm `0.30.0-1`, because `bdk-rn` 1.0.0 needs it, and that version already uses `uint64_t`.
- `patches/@breeztech__breez-sdk-spark-react-native@0.28.6.patch` aligns the podspec dependency with it, as the 0.15.1 patch did.
- The SDK now ships Swift sources (passkey helper): `pod install` updated `Podfile.lock`.

### Breaking changes handled

| Change                                                                                                  | Where                                  |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `PrepareSendPaymentRequest.paymentRequest` is a `PaymentRequest` (`PaymentRequest.Input({ input })`)    | `breez-context.tsx` `prepareSend`      |
| `ReceivePaymentMethod.Bolt11Invoice` takes `receiverIdentityPublicKey` and `preimage` (both left unset) | `breez-context.tsx` `receiveBolt11`    |
| `MaxFee` is a record `{ onchain: MaxOnchainFee, proportionalPpm }`                                      | `lib/breez/deposits.ts`                |
| `claimDeposit` returns `{ outcome }` (`Settled`, `Submitted`, `Deferred`)                               | Part 5                                 |
| `DepositInfo` adds `instantClaimStatus`, `refundState` and `maxClaimFee`; `DepositTooSmall` claim error | Part 4                                 |
| `syncWallet` resolves with `lastSyncError` when it could not refresh the balances (0.28.0)              | `lib/breez/wallet-sync.ts` (a failure) |

### Behaviour changes to know

- The SDK database migrates forward on first launch. **A build with an older SDK cannot open it again**, so a rollback build must also use 0.28.6 or later.
- The SDK syncs on its own every 60 s (`syncIntervalSecs`, 0.28.0).
- The parser follows BIP-321 and restricts BIP-353 lookups. Expired Lightning invoices are rejected.
- Deposits can be claimed early (instant or expedited claims) when the provider offers it within the max claim fee.

### Fix found on the way

`refreshUnclaimedDeposits` checked `isConnected` and `isBreezInitialized` in a stale closure. The call made right after connecting saw `false` and emptied the list, so deposits showed up only at the next 10 s read. It now checks the SDK ref.

## Part 2: SDK logs

- `startSdkLogging()` (`lib/breez/sdk-logs.ts`) runs before `connect`, once per app process. It has the SDK write `sdk.log` in `documentDirectory/breez-sdk-logs/`, with the SDK default filter (debug for the Breez and Spark crates, info for the rest), the level Breez support asks for. If it fails, the wallet still starts.
- The SDK appends to `sdk.log` and never trims it. At startup, a log of 5 MB or more becomes `sdk.previous.log`, replacing the older one, so the folder holds about 10 MB at most.
- **Settings → Developers → Breez SDK → Export SDK logs** (`breez-sdk-export-logs`) shares one text file through the system share sheet (`expo-sharing`, new dependency). The file holds a header (app version and build, SDK version, platform, network, date), then the previous log, then the current log. If there is nothing to share or the device cannot share, a message says so.
- The logs contain payment and address details but never the Recovery Phrase. Since 0.28.0 the SDK keeps secrets out of its debug output. The screen says this above the button.

## Part 3: Automatic claim limit

`config.maxDepositClaimFee = autoClaimMaxFee()`: **500 sats + 0.1% of the Deposit** (`MaxOnchainFee.Fixed(500)`, `proportionalPpm: 1000`).

- 500 sats is Glow's default. It covers the provider's usual standard claim fee, so most deposits are claimed automatically at 3 confirmations, and it bounds what a small deposit can lose without the user agreeing.
- The proportional part follows the provider's fee, which grows with the amount, so large deposits are still claimed automatically.
- Above the limit, the Deposit waits for the user to approve the fee (Part 4). A manual claim pays at most the approved fee (`approvedClaimMaxFee`, no proportional part). The SDK keeps that ceiling for this Deposit.

## Part 4: Deposits in the lists and the deposits screen

`getDepositState(deposit)` (`lib/breez/deposits.ts`) gives each Deposit one state, checked in this order:

| State              | When                                                                    | Shown as                   |
| ------------------ | ----------------------------------------------------------------------- | -------------------------- |
| `refunding`        | `refundState` is set                                                    | Being refunded             |
| `claiming`         | `instantClaimStatus` is `Submitted` or `Claimed`                        | Being credited             |
| `tooSmall`         | claim error `DepositTooSmall`, at any depth                             | Too small to claim         |
| `confirming`       | not mature (fewer than 3 confirmations), whatever the other claim error | Waiting for confirmations  |
| `awaitingClaim`    | mature, no claim error                                                  | Being claimed              |
| `needsFeeApproval` | mature, `MaxDepositClaimFeeExceeded`                                    | Fee approval needed        |
| `failed`           | mature, `MissingUtxo` or `Generic`                                      | Claim failed (SDK retries) |

- **Transaction lists** (Transactions tab, Lightning account): deposits not credited yet come first, as a pending receive of the Lightning wallet. They show "On-chain deposit" with their state instead of a date, because a Deposit record has no date. Tapping one opens the deposits screen.
  - They appear in the All, Pending and Lightning filters.
  - A Deposit whose claim is `Claimed` is hidden (`getVisibleDeposits`): its credit is already a payment, and showing both would count it twice.
- **Deposits screen** (`/wallets/unclaimed-deposits`, title "On-chain deposits"): every visible Deposit, with its amount, a state badge, an explanation and a short outpoint. Only `needsFeeApproval` shows the fee, the net amount and the claim button. The confirmation alert is unchanged. With no Deposit, the screen shows an empty state.
- The Lightning account banner still counts only the deposits that need a fee approval.

## Part 5: Claim result

`useBreez().claimDeposit(txid, vout, maxFeeSats)` resolves with a `ClaimResult`. It rejects only on an unexpected error.

| SDK answer                                 | `ClaimResult`            | Message                                      |
| ------------------------------------------ | ------------------------ | -------------------------------------------- |
| `Settled`, payment `Completed`             | `credited`               | Deposit credited successfully (success)      |
| `Settled`, payment still `Pending`         | `crediting`              | Claim sent, arriving in a few moments (info) |
| `Submitted` (early claim)                  | `crediting`              | same                                         |
| `Deferred(MaxFeeExceeded)`, or the error   | `feeChanged` (+ new fee) | Fee is now X sats, confirm again (warning)   |
| `Deferred(NoEarlyClaimAvailable/Declined)` | `notYet`                 | Credited automatically later (info)          |
| error `DepositClaimInProgress`             | `inProgress`             | Already being claimed (info)                 |
| error `DepositTooSmall`                    | `tooSmall`               | Too small for the claim fee (warning)        |
| any other error                            | rejects                  | Claim failed, try again (danger)             |

After the answer, the context refreshes the stored deposits, so a new fee shows at once. It then starts a Spark sync without waiting for it: the sync is what claims the incoming transfer and corrects the balance. **"Credited" is never shown while the payment is still pending.**

## Maestro

| Part    | Flow                    | What it covers                                                                                      |
| ------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| 1       | every flow (full suite) | The app starts, connects and pays with SDK 0.28.6 (parsing, invoices, Lightning Address, links)     |
| 2       | `settings-about`        | Export SDK logs opens the share sheet with no error message, then back to the screen                |
| 4       | `deposits` (new)        | No deposit row or claim banner without a Deposit; the deposits screen (opened by its link) is empty |
| 3, 4, 5 | none                    | Need a funded Deposit: manual checklist below                                                       |

## Manual checklist (needs a real Deposit)

1. Send about 10,000 sats to the Lightning account's on-chain address. The Deposit appears at once in the Lightning account and the Transactions tab as "On-chain deposit · Waiting for confirmations".
2. After 3 confirmations: if the provider's fee is within 500 sats + 0.1%, the Deposit is claimed with no action, the success screen opens and the balance grows. Otherwise "Fee approval needed" and the banner appear.
3. Approve the fee: the message is "Deposit credited successfully" or "Claim sent…". The balance is right within a minute, and the row leaves the list.
4. Export the SDK logs: the file names 0.28.6 and contains the claim (`Claiming static deposit`, `Claimed transfer`).
5. Upgrade test: install the 1.5.2 build (SDK 0.15.1) with a funded wallet, then this build over it. The balance, history and Lightning Address are unchanged.

## Out of scope

- Refunding a Deposit to a Bitcoin address (`refundDeposit`). A `tooSmall` Deposit can only be refunded, so a later change should add a refund screen.
- Letting the user change the automatic claim limit.
- Showing a Deposit's confirmation count (`fetchClaimDepositQuote` would make one network call per Deposit).
