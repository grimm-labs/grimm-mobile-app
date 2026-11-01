# Spec: on-chain send amount fix and App Lock

Status: approved. Implementation branch: `feat/app-lock-and-onchain-amount-fix`. Vocabulary: [GLOSSARY.md](../../GLOSSARY.md). Decisions: [ADR 0001](../adr/0001-app-lock-is-a-ui-gate.md).

Delivered as two pull requests, in this order:

1. **PR 1**: on-chain send amount fix (Part 1). Small and urgent.
2. **PR 2**: App Lock (Part 2). Adds a native dependency and a prebuild, so it needs a longer review and test cycle.

## Part 1: on-chain send amount fix (PR 1)

### Problem

The on-chain send flow is `send-onchain/enter-address` → `enter-amount` → `summary` → `transaction-result`.

- `summary.tsx` calls `sendTransaction(recipientAddress, 1000, feeSatsPerVbyteNum)`. Every on-chain send transfers 1000 sats, whatever the user entered. The bug has been there since the flow was added (#132).
- `enter-amount.tsx` only blocks when the Amount is greater than or equal to the balance. The user can enter an Amount that the balance covers but the Amount plus the Network Fee does not.
- `summary.tsx` estimates the Network Fee in a `useEffect` with no `catch`. When the estimation fails (for example insufficient funds), the fee stays displayed as 0 and the slider stays enabled.
- When `sendTransaction` throws, `summary.tsx` only logs the error. The user sees the loader stop and nothing else.
- `summary.tsx` passes the Total (`totalSats`) to `transaction-result`, which displays it under "Transaction sent successfully!". The summary showed the Amount, so the two screens disagree.

### Behaviour

1. The summary sends the Amount received from `enter-amount` (`satsValue`), with the selected fee rate.
2. The transaction that BDK builds is the source of truth for whether the wallet can pay. `enter-amount` keeps its current check.
3. While the Network Fee is being estimated, the slider is disabled.
4. When the estimation fails, the summary shows an error under the details and the slider stays disabled:
   - if BDK reports insufficient funds: "Insufficient funds to cover the amount and the network fee";
   - otherwise: "Unable to estimate the network fee".
5. When the send fails, the summary shows an error flash message (`showErrorMessage`) with "The transaction could not be sent. Please try again." The user stays on the summary and can slide again.
6. `transaction-result` receives and displays the Amount, not the Total. Its title does not change.

### Changes

- `src/app/send-onchain/summary.tsx`:
  - pass `satsValue` to `sendTransaction`;
  - add estimation state (pending, failed with reason) and catch the estimation error;
  - set `disabled` on `SlideToConfirm` while pending or failed;
  - show the send error;
  - pass `satsValue` to `transaction-result`.
- `src/translations/en.json` and `fr.json`, under `onchainSend.summary.errors`: `insufficientFunds`, `feeEstimationFailed`, `sendFailed`. Run `pnpm lint:translations`.

### Tests

New `src/app/send-onchain/__tests__/summary.test.tsx`, following the pattern of `src/app/send/__tests__/*.test.tsx` (stable `mockT`, mocked `expo-router`, `@/lib/context`):

- confirming calls `sendTransaction` with the entered Amount and fee rate, then navigates to `transaction-result` with the Amount;
- a rejected fee estimation shows the matching error and keeps the slider disabled;
- a rejected send shows the send error and does not navigate.

Mock `@/components/slide-to-confirm` with a pressable that calls `onConfirm` unless `disabled`, so the tests do not depend on gestures.

### Out of scope

Sending the whole balance, a custom fee rate and RBF fee bumping.

## Part 2: App Lock (PR 2)

### Goal

Today anyone holding the user's unlocked phone can open Grimm App, read the Recovery Phrase in Settings › Backup and empty both wallets. App Lock lets the user hide the app behind a PIN, with optional Biometric Unlock.

App Lock is a UI gate: the Recovery Phrase stays stored as today and the PIN is not an encryption key. See [ADR 0001](../adr/0001-app-lock-is-a-ui-gate.md).

### Behaviour

#### Turning App Lock on and off

1. App Lock is off by default, for new and existing users. Onboarding does not change.
2. **Settings › Security › App Lock** (`settings/app-lock`) replaces the commented-out PIN and Face ID entries in `(app)/settings.tsx`.
   - When App Lock is off, the screen offers **Turn on App Lock**.
   - When it is on, the screen offers **Biometric Unlock** (a switch), **Change PIN** and **Turn off App Lock**.
3. Turning on: the user enters a 6-digit PIN, then enters it again.
   - Each entry is submitted automatically at the 6th digit; there is no submit button.
   - If the two entries differ, the screen says so and starts over at the first entry.
   - If the phone supports Biometric Unlock (see "Biometrics" below), the app then offers to turn it on (**Turn on** / **Not now**).
   - Turning Biometric Unlock on, from this offer or from the switch, opens the biometric prompt once (`disableDeviceFallback: true`). It is turned on only if the prompt succeeds. From the switch, this comes after the Sensitive Action prompt (item 4). _Decided 2026-11-01._
4. Changing the PIN, turning Biometric Unlock on or off, and turning App Lock off are Sensitive Actions (see below). Changing the PIN then asks for the new PIN twice.
5. Turning App Lock off deletes the PIN, Biometric Unlock and the Lockout state.

#### Home card

6. A card on the home screen invites the user to turn App Lock on ("Protect your wallet"). It reuses the style of `SeedPhraseBackupNotification`.
7. The card is shown only when App Lock is off, the card has not been dismissed, and the Recovery Phrase is backed up. Backing up comes first, so the two cards never stack.
8. Tapping the card opens `settings/app-lock`. Closing it hides it for good.

#### When the app locks

9. When App Lock is on, the app is locked:
   - at every cold start;
   - when it returns to the foreground after more than 30 seconds in the `background` state.
10. The `inactive` state does not count, so the biometric prompt, permission dialogs and the share sheet never relock the app. The 30-second delay is fixed. `PrivacyOverlay` keeps working as today.

#### Lock Screen

11. The Lock Screen is an overlay mounted in the root layout, in a React Native `Modal`, so it covers every route, bottom sheet and modal. It does not navigate.
    - After unlocking, the user is back on the screen they were on.
    - A `lightning:` link or a notification tap opens its screen behind the Lock Screen; the user sees it after unlocking.
12. The splash screen stays up until the App Lock state is loaded, so the home screen never flashes before the Lock Screen.
13. The Lock Screen shows:
    - the logo and "Enter your PIN";
    - 6 dots and a keypad with a delete key;
    - a biometric button when Biometric Unlock is on and available;
    - a **Forgot PIN?** link.
14. When Biometric Unlock is on and available, the biometric prompt opens automatically when the Lock Screen appears. Cancelling or failing it leaves the keypad usable, and the biometric button opens the prompt again.
15. The Breez and BDK wallets start and sync behind the Lock Screen as they do today.

#### Wrong PIN and Lockout

16. Wrong PINs are counted, whether typed on the Lock Screen or in a Sensitive Action prompt. A correct PIN or a successful Biometric Unlock resets the count.
17. The count and the Lockout survive killing or restarting the app.
18. Biometric failures do not count: the operating system limits them and the user falls back to the PIN.
19. The schedule:

| Wrong PINs in a row | What happens                                                  |
| ------------------- | ------------------------------------------------------------- |
| 1 to 4              | "Wrong PIN. {{count}} attempts left before a 30-second wait." |
| 5                   | Lockout of 30 s                                               |
| 6                   | Lockout of 1 min                                              |
| 7                   | Lockout of 5 min                                              |
| 8                   | Lockout of 15 min                                             |
| 9 and more          | Lockout of 1 h each                                           |

20. During a Lockout, the keypad is disabled and a countdown is shown (reuse `useCountdown` from `lib/hooks`). Biometric Unlock stays available. The app never deletes anything automatically.
21. The Lockout end is stored as a timestamp. If the device clock moves back so that the remaining time exceeds the current step, the Lockout restarts from now with that step's duration.

#### Forgot PIN

22. **Forgot PIN?** opens a confirmation. It explains that the only way forward is a Wallet Reset, and that the funds are lost without the Recovery Phrase. The confirm button is destructive ("Reset wallet").
23. Confirming runs the same Wallet Reset as **Sign Out** in Settings, then shows onboarding.

#### Sensitive Actions

24. The Sensitive Actions are:
    - viewing the Recovery Phrase (`backup-seed-phrase/recovery-seed-phrase.tsx` and `verify.tsx`, which also reads the words to check the user's answers);
    - changing the PIN, turning Biometric Unlock on or off, and turning App Lock off.
25. Sending a payment and signing out are not Sensitive Actions.
26. When App Lock is on, a Sensitive Action opens the Lock Screen in prompt mode: the same keypad, Biometric Unlock and wrong-PIN rules, plus a **Cancel** button. _Decided 2026-11-01:_
    - **Forgot PIN?** is shown in prompt mode too.
    - The Android back button cancels the prompt. On the Lock Screen in lock mode, it does nothing.
    - If the app locks (item 9) while a prompt is open, the Sensitive Action resolves `false` and the Lock Screen switches to lock mode.
27. When App Lock is off, viewing the Recovery Phrase asks for the phone's authentication: strong biometrics, with fallback to the Device Passcode. If the phone has neither, the words are shown as today.
28. For the Recovery Phrase, one successful authentication grants access for 5 minutes, or until the app goes to the background. The user authenticates once per backup, not on each of the two screens. Only an authentication asked for the Recovery Phrase grants this access: unlocking the Lock Screen does not. _Decided 2026-11-01._
29. Cancelling or failing the prompt keeps the protected content hidden. On the Recovery Phrase screens, the app goes back.

#### Biometrics

30. Biometric Unlock is available when the phone has strong biometrics enrolled:
    - on Android, Class 3 only (`biometricsSecurityLevel: 'strong'`, `getEnrolledLevelAsync()` returns `BIOMETRIC_STRONG`);
    - on iOS, Face ID or Touch ID.
31. On a phone with only weak biometrics (many 2D face unlocks), the Biometric Unlock option is hidden and the PIN works as usual.
32. Biometric Unlock never falls back to the Device Passcode (`disableDeviceFallback: true`). Only the Recovery Phrase prompt with App Lock off (item 27) accepts the Device Passcode.
33. If the user removes their biometrics from the phone after turning Biometric Unlock on, the Lock Screen only offers the PIN. The settings screen shows Biometric Unlock as unavailable.

#### Wallet Reset

34. The Wallet Reset (Sign Out and Forgot PIN) also deletes the PIN, Biometric Unlock, the Lockout state and the dismissed flag of the home card.

### Storage

All App Lock state lives in expo-secure-store, next to the Recovery Phrase. On iOS the Keychain survives an uninstall, so App Lock follows the Recovery Phrase if the app is reinstalled.

| Key                       | Content                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `appLockPinHash`          | hex SHA-256 of `salt + PIN` (expo-crypto `digestStringAsync`) |
| `appLockPinSalt`          | 16 random bytes, hex (expo-crypto `getRandomBytes`)           |
| `appLockBiometricEnabled` | `'true'` or absent                                            |
| `appLockFailedAttempts`   | number of wrong PINs in a row                                 |
| `appLockLockoutUntil`     | end of the current Lockout, ms timestamp                      |

App Lock is on when `appLockPinHash` exists. The home card's dismissed flag is the AsyncStorage key `appLockCardDismissed` (JSON helpers in `lib/storage.tsx`).

A 6-digit PIN hash is trivial to brute-force for someone who can read the secure store, but that person can read the Recovery Phrase directly. This matches ADR 0001.

### Changes

**Native**

- Add `expo-local-authentication@~16.0.5` with `npx expo install`.
- Add its config plugin to `app.config.ts` with a `faceIDPermission` message: "Allow $(PRODUCT_NAME) to use Face ID to unlock your wallet."
- Regenerate the committed native projects with `pnpm prebuild:development`. Keep only the changes this module brings: `NSFaceIDUsageDescription`, the biometric permissions in `AndroidManifest.xml`, `Podfile.lock`.

**Logic: `src/lib/app-lock/`** (pure functions where possible, unit-tested)

- `pin.ts`: create salt, hash, verify.
- `lockout.ts`: Lockout duration for a count, remaining time, clock-moved-back rule.
- `auto-lock.ts`: whether to lock on resume, given the time the app went to the background.
- `biometrics.ts`: availability (strong only) and the two prompts (Biometric Unlock; phone authentication with Device Passcode fallback).
- `storage.ts`: the secure-store keys above.

**State: `src/lib/context/app-lock-context.tsx`** (`AppLockProvider`, `useAppLock`, exported from `lib/context`)

- State: `isAppLockLoaded`, `isAppLockEnabled`, `isLocked`, `isBiometricUnlockEnabled`, `isBiometricUnlockAvailable`, `failedAttempts`, `lockoutUntil`.
- Actions: `enableAppLock(pin)`, `changePin(pin)`, `disableAppLock()`, `setBiometricUnlockEnabled(enabled)`, `unlockWithPin(pin)`, `unlockWithBiometrics()`, `authorizeSensitiveAction(kind)` (resolves to `true` or `false`), `resetAppLock()`.
- It is a separate provider so `AppContext` does not change, and neither does the full `AppContext` built in `screen-capture-guard.test.tsx`. It sits directly inside `AppContextProvider` in `src/app/_layout.tsx`.

**Components**

- `src/components/pin-pad.tsx`: dots and keypad, reused by the Lock Screen and the set-PIN screen.
- `src/components/lock-screen.tsx`: the overlay (lock and prompt modes). It is mounted after `<FlashMessage />` inside `BottomSheetModalProvider`, so it can use `useBreez`/`useBdk` for the Wallet Reset.
- `src/components/app-lock-notification.tsx`: the home card.

**Wallet Reset**

- `src/lib/hooks/use-wallet-reset.ts` runs what `handleLogout` in `(app)/settings.tsx` does today (`resetAppData`, `disconnectBreez`, `disconnectBdk`, navigate to `/`), plus `resetAppLock()` and clearing `appLockCardDismissed`.
- Settings' Sign Out and the Lock Screen's Forgot PIN both use it.

**Screens**

- `src/app/(app)/_layout.tsx`: hide the splash only once `isAppLockLoaded` is true.
- `src/app/(app)/index.tsx`: show the home card (item 7).
- `src/app/(app)/settings.tsx`:
  - add the App Lock item;
  - remove the commented PIN and Face ID code;
  - use `useWalletReset`.
- `src/app/settings/app-lock/index.tsx`: the management screen.
- `src/app/settings/app-lock/set-pin.tsx`: enter and confirm a PIN, in `create` or `change` mode.
- `src/app/settings/backup-seed-phrase/recovery-seed-phrase.tsx` and `verify.tsx`: call `authorizeSensitiveAction('recoveryPhrase')` before reading the Recovery Phrase, and go back when it resolves `false`.

**Translations**

New `appLock.*` keys in `en.json` and `fr.json`. The French UI says "portefeuille", never "wallet".

| EN                  | FR                          |
| ------------------- | --------------------------- |
| App Lock            | Verrouillage de l'app       |
| PIN                 | code PIN                    |
| Biometric unlock    | Déverrouillage biométrique  |
| Enter your PIN      | Saisissez votre code PIN    |
| Forgot PIN?         | Code PIN oublié ?           |
| Protect your wallet | Protégez votre portefeuille |

### testIDs

- **Lock Screen:** `lock-screen`, `lock-screen-error`, `lock-screen-lockout`, `lock-screen-biometric`, `lock-screen-forgot-pin`, `lock-screen-cancel`.
- **Forgot PIN confirmation:** `lock-screen-reset-confirm`, `lock-screen-reset-cancel`.
- **Keypad:** `<prefix>-key-<digit>` and `<prefix>-key-delete`, with the prefixes `lock-screen-pin-pad` and `app-lock-set-pin-pad`.
- **Settings:** `settings-app-lock`, `app-lock-turn-on`, `app-lock-biometric-switch`, `app-lock-change-pin`, `app-lock-turn-off`, `app-lock-set-pin-title`, `app-lock-set-pin-error`, `app-lock-biometric-offer-accept`, `app-lock-biometric-offer-decline`.
- **Home card:** `home-app-lock-card`, `home-app-lock-card-close`.

### Tests

**Jest**

- `src/lib/app-lock/__tests__/`:
  - hash and verify (with a random salt);
  - the full Lockout schedule;
  - the clock-moved-back rule;
  - the 30-second resume rule (`background` counts, `inactive` does not).
- `src/lib/context/__tests__/app-lock-context.test.tsx`:
  - enable, unlock with the right PIN, wrong PINs up to a Lockout;
  - the count survives a remount;
  - disable and reset clear everything;
  - the Recovery Phrase grant expires after 5 minutes and on background.
- Lock Screen, settings screens, home card visibility and the Recovery Phrase screens' cancel path.
- `expo-local-authentication` and `expo-secure-store` are mocked. Use a stable `mockT`.

**Maestro**

- `.maestro/app-lock.yaml`:
  - turn App Lock on from Settings;
  - relaunch the app, then check the Lock Screen, a wrong PIN error and an unlock;
  - send the app to the background for more than 30 s, then check it is locked again;
  - open the backup and check the PIN is asked;
  - change the PIN;
  - turn App Lock off.
- `.maestro/app-lock-forgot-pin.yaml`: 5 wrong PINs, then check the 30 s Lockout. Then Forgot PIN, Reset wallet, and check onboarding is shown.
- `.maestro/wallet-backup-restore.yaml`: assert `home-app-lock-card` right after the backup.
- Other flows do not change: App Lock is off by default, and the CI emulator has no screen lock, so the Recovery Phrase is shown without a prompt. Locally, run the flows on a device or emulator without a screen lock.
- The two new flows add about 3 to 4 minutes to the E2E run.

**Manual checklist** (Maestro cannot drive biometrics reliably)

- iPhone with Face ID:
  - turn Biometric Unlock on;
  - unlock with it;
  - cancel it, then unlock with the PIN.
- Android with a fingerprint: the same checks.
- Android with only weak face unlock: the Biometric Unlock option is hidden.
- Remove the enrolled biometrics after turning Biometric Unlock on: only the PIN is offered.
- App Lock off, phone with a screen lock: viewing the Recovery Phrase asks for the phone's authentication.

### Docs to update

- `AGENTS.md`:
  - replace "There is no PIN or biometric lock" with a description of App Lock;
  - add `AppLockProvider` to the provider order and to the state table;
  - add the new secure-store keys;
  - note that the Maestro flows need a device without a screen lock.
- `.maestro/README.md`: the two new flows, the coverage table, and the screen-lock note.
- `README.md`: tick "Biometric authentication" in the roadmap.

### Out of scope

- Asking for authentication on every payment.
- A configurable auto-lock delay.
- Encrypting the Recovery Phrase (ADR 0001).
- Accepting weak biometrics.
- A PIN step in onboarding.
- Renaming "Sign Out".
- Removing the existing "copy Recovery Phrase to clipboard" action. The clipboard is readable by other apps; this is worth its own decision later.
