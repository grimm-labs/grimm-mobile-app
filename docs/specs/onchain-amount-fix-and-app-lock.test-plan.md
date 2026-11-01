# Test plan: on-chain send amount fix and App Lock

Traceability from [the spec](./onchain-amount-fix-and-app-lock.md) to the automated tests. One row per test; an item has as many rows as it needs to be fully covered.

Levels: **Unit** (Jest, pure functions in `src/lib/…`, no React), **Integration** (Jest, real provider + real components/screens + real `src/lib/app-lock`, only the native boundaries faked), **E2E** (Maestro, `.maestro/`).

Status: **green** means the test was seen red, then green. **not run** means the test is written but was never executed.

## Part 1: on-chain send amount fix

`summary` = `src/app/send-onchain/__tests__/summary.test.tsx`.

| Item | Level       | Test file › test name                                                                                                                                                 | Status |
| ---- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P1-1 | Integration | `summary` › sends the entered Amount in sats with the selected fee rate (Amount entered in sats)                                                                      | green  |
| P1-1 | Integration | `summary` › sends the entered Amount in sats with the selected fee rate (Amount entered in BTC)                                                                       | green  |
| P1-2 | Integration | `src/app/send-onchain/__tests__/enter-amount.test.tsx` › keeps Continue enabled for an Amount below the balance, even when Amount + Network Fee exceeds it            | green  |
| P1-2 | Integration | `src/app/send-onchain/__tests__/enter-amount.test.tsx` › disables Continue when the Amount is greater than or equal to the balance                                    | green  |
| P1-2 | Integration | `summary` › shows the insufficient-funds message and keeps the slider disabled when BDK reports insufficient funds (BDK is the source of truth)                       | green  |
| P1-3 | Integration | `summary` › disables the slider while the Network Fee estimation is pending                                                                                           | green  |
| P1-3 | Integration | `summary` › does not estimate again when the BDK context re-renders (no slider flicker on each 60 s sync)                                                             | green  |
| P1-4 | Unit        | `src/lib/bdk/__tests__/errors.test.ts` › recognises both BDK insufficient-funds errors and nothing else                                                               | green  |
| P1-4 | Integration | `summary` › shows the insufficient-funds message and keeps the slider disabled when BDK reports insufficient funds (`InsufficientFunds` and `CoinSelection` variants) | green  |
| P1-4 | Integration | `summary` › shows the generic estimation message and keeps the slider disabled when the estimation fails for another reason                                           | green  |
| P1-5 | Integration | `summary` › shows the send error, stays on the summary and lets the user slide again when the send fails                                                              | green  |
| P1-6 | Integration | `summary` › navigates to transaction-result with the Amount, not the Total                                                                                            | green  |
| P1-6 | Integration | `src/app/send-onchain/__tests__/transaction-result.test.tsx` › displays the Amount it receives under the unchanged title                                              | green  |

## Part 2: App Lock

Short names: `pin`, `lockout`, `auto-lock`, `biometrics`, `storage`, `grant`, `home-card` = `src/lib/app-lock/__tests__/<name>.test.ts` (`grant` is `recovery-phrase-grant`); `ctx` = `src/lib/context/__tests__/app-lock-context.test.tsx`; `pin-pad`, `lock-screen`, `card` = `src/components/__tests__/{pin-pad,lock-screen,app-lock-notification}.test.tsx`; `home`, `settings-tab`, `layout` = `src/app/(app)/__tests__/{index,settings,layout}.test.tsx`; `app-lock-screen`, `set-pin` = `src/app/settings/app-lock/__tests__/{index,set-pin}.test.tsx`; `recovery`, `verify` = `src/app/settings/backup-seed-phrase/__tests__/{recovery-seed-phrase,verify}.test.tsx`; `reset` = `src/lib/hooks/__tests__/use-wallet-reset.test.tsx`; `i18n` = `src/translations/__tests__/app-lock-translations.test.ts`.

Integration tests render the real `AppLockProvider` and `LockScreen` (`renderWithAppLock` in `src/lib/app-lock/__tests__/helpers/`) and fake only expo-secure-store, expo-local-authentication, expo-crypto, `AppState`, expo-router and the Breez/BDK contexts. Every App Lock suite spies on `console.*` and asserts that no call contains the PIN or the Recovery Phrase.

E2E status: see "Maestro" at the end.

| Item  | Level       | Test file › test name                                                                                                  | Status      |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------- | ----------- |
| P2-1  | Integration | `ctx` › is off and unlocked by default with an empty secure store                                                      | green       |
| P2-1  | Integration | `app-lock-screen` › App Lock off: offers Turn on App Lock only                                                         | green       |
| P2-1  | Integration | `lock-screen` › never shows on a cold start without a PIN                                                              | green       |
| P2-1  | E2E         | every existing flow (onboarding unchanged, no Lock Screen)                                                             | see Maestro |
| P2-2  | Integration | `settings-tab` › the App Lock item opens settings/app-lock                                                             | green       |
| P2-2  | Integration | `app-lock-screen` › App Lock on: offers Biometric Unlock, Change PIN and Turn off App Lock                             | green       |
| P2-3  | Integration | `pin-pad` › fills the dots and submits automatically at the 6th digit                                                  | green       |
| P2-3  | Integration | `pin-pad` › the delete key removes the last digit                                                                      | green       |
| P2-3  | Integration | `pin-pad` › ignores the keys while a submission is pending; ignores fast taps that land after the 6th digit            | green       |
| P2-3  | Integration | `set-pin` › create: two matching entries turn App Lock on (with the delete key)                                        | green       |
| P2-3  | Integration | `set-pin` › two different entries show the error and start over at the first entry                                     | green       |
| P2-3  | Integration | `set-pin` › create: offers Biometric Unlock when available, Turn on enables it                                         | green       |
| P2-3  | Integration | `set-pin` › create: offers Biometric Unlock when available, Not now leaves it off                                      | green       |
| P2-3  | Integration | `set-pin` › create: a failed biometric prompt in the offer leaves Biometric Unlock off                                 | green       |
| P2-3  | Integration | `set-pin` › create: no offer when Biometric Unlock is unavailable                                                      | green       |
| P2-3  | Integration | `ctx` › turning Biometric Unlock on opens the biometric prompt and turns it on only if it succeeds                     | green       |
| P2-3  | Unit        | `pin` › is exactly 6 digits; `ctx` › refuses a PIN that is not 6 digits                                                | green       |
| P2-3  | E2E         | `app-lock.yaml` › turn App Lock on from Settings                                                                       | see Maestro |
| P2-4  | Integration | `app-lock-screen` › Change PIN asks for authentication first; cancelling stays on the screen                           | green       |
| P2-4  | Integration | `app-lock-screen` › toggling Biometric Unlock asks for authentication; cancelling leaves it unchanged                  | green       |
| P2-4  | Integration | `app-lock-screen` › Turn off asks for authentication; cancelling leaves App Lock on, authorising deletes the five keys | green       |
| P2-4  | Integration | `set-pin` › change: asks for the new PIN twice, then the new PIN unlocks and the old one is refused                    | green       |
| P2-4  | Integration | `ctx` › changePin: the new PIN unlocks and the old one is refused                                                      | green       |
| P2-4  | E2E         | `app-lock.yaml` › change the PIN                                                                                       | see Maestro |
| P2-5  | Integration | `ctx` › disableAppLock deletes the five keys                                                                           | green       |
| P2-5  | Integration | `app-lock-screen` › Turn off … authorising deletes the five keys                                                       | green       |
| P2-5  | E2E         | `app-lock.yaml` › turn App Lock off                                                                                    | see Maestro |
| P2-6  | Integration | `card` › shows "Protect your wallet" in the backup card style                                                          | green       |
| P2-7  | Unit        | `home-card` › shows the card in exactly one of the 8 combinations                                                      | green       |
| P2-7  | Integration | `card` › App Lock on × dismissed × backed up (8 combinations, `it.each`)                                               | green       |
| P2-7  | Integration | `home` › never stacks the backup card and the App Lock card (8 combinations)                                           | green       |
| P2-7  | E2E         | `wallet-backup-restore.yaml` › `home-app-lock-card` right after the backup                                             | see Maestro |
| P2-8  | Integration | `card` › tapping opens settings/app-lock                                                                               | green       |
| P2-8  | Integration | `card` › closing hides it for good, across a remount                                                                   | green       |
| P2-9  | Unit        | `auto-lock` › does not lock after 29 999 ms in background, locks after 30 001 ms                                       | green       |
| P2-9  | Integration | `ctx` › starts locked on a cold start with a PIN                                                                       | green       |
| P2-9  | Integration | `ctx` › never locks on a cold start without a PIN                                                                      | green       |
| P2-9  | Integration | `ctx` › 29 999 ms in background stays unlocked, 30 001 ms locks                                                        | green       |
| P2-9  | Integration | `ctx` › never locks without App Lock                                                                                   | green       |
| P2-9  | E2E         | `app-lock.yaml` › relaunch shows the Lock Screen; > 30 s in background locks again                                     | see Maestro |
| P2-10 | Unit        | `auto-lock` › never locks without a background timestamp (inactive only)                                               | green       |
| P2-10 | Unit        | `auto-lock` › measures from the background event in the iOS sequence inactive → background → active                    | green       |
| P2-10 | Unit        | `auto-lock` › keeps the first background timestamp, and forgets it once active                                         | green       |
| P2-10 | Integration | `ctx` › 10 minutes in inactive does not lock                                                                           | green       |
| P2-10 | Integration | `ctx` › the iOS sequence inactive → background → active is measured from background                                    | green       |
| P2-10 | Integration | `src/components/__tests__/privacy-overlay.test.tsx` (unchanged, still green)                                           | green       |
| P2-11 | Integration | `lock-screen` › is rendered in a React Native Modal                                                                    | green       |
| P2-11 | Integration | `lock-screen` › unlocking keeps the state of the screen below (typed input)                                            | green       |
| P2-11 | Integration | `lock-screen` › never navigates when locking or unlocking                                                              | green       |
| P2-11 | Integration | `lock-screen` › a screen opened behind the Lock Screen (link, notification) is shown after unlocking                   | green       |
| P2-11 | Integration | `ctx` › a Sensitive Action asked before the App Lock state is loaded waits for it (link opened at a cold start)        | green       |
| P2-12 | Integration | `layout` › does not hide the splash before isAppLockLoaded is true (with a wallet, without a wallet)                   | green       |
| P2-12 | Integration | `ctx` › is not loaded before the secure store answers                                                                  | green       |
| P2-13 | Integration | `lock-screen` › shows the logo, "Enter your PIN", 6 dots, the keypad with delete and Forgot PIN                        | green       |
| P2-13 | Integration | `lock-screen` › shows the biometric button only when Biometric Unlock is on and available                              | green       |
| P2-14 | Integration | `lock-screen` › opens the biometric prompt automatically when it appears, without the Device Passcode                  | green       |
| P2-14 | Integration | `lock-screen` › a cancelled or failed biometric prompt leaves the keypad usable; the button opens it again             | green       |
| P2-15 | Integration | `layout` › starts Breez and BDK while the app is locked                                                                | green       |
| P2-16 | Integration | `ctx` › unlocks with the right PIN and resets the count                                                                | green       |
| P2-16 | Integration | `ctx` › a successful Biometric Unlock unlocks and resets the count, even during a Lockout                              | green       |
| P2-16 | Integration | `ctx` › a wrong PIN in the Sensitive Action prompt increments the same count                                           | green       |
| P2-16 | Integration | `lock-screen` › a wrong PIN in prompt mode counts with the Lock Screen                                                 | green       |
| P2-17 | Integration | `ctx` › keeps the count and the Lockout across a remount                                                               | green       |
| P2-17 | Integration | `ctx` › a Lockout that ended while the app was closed is over at the next start                                        | green       |
| P2-18 | Integration | `ctx` › a failed or cancelled biometric prompt does not change the count                                               | green       |
| P2-18 | Integration | `lock-screen` › a cancelled or failed biometric prompt leaves the keypad usable … (no `lock-screen-error`)             | green       |
| P2-19 | Unit        | `lockout` › 1 to 4 wrong PINs: no Lockout and the attempts left                                                        | green       |
| P2-19 | Unit        | `lockout` › 5th to 10th wrong PIN: 30 s, 1 min, 5 min, 15 min, 1 h, 1 h                                                | green       |
| P2-19 | Integration | `lock-screen` › 4 wrong PINs show "1 attempt left"                                                                     | green       |
| P2-19 | Integration | `lock-screen` › the 6th to 10th wrong PINs give 1 min, 5 min, 15 min, 1 h and 1 h                                      | green       |
| P2-19 | Integration | `ctx` › counts wrong PINs and starts a 30 s Lockout at the 5th                                                         | green       |
| P2-19 | Integration | `ctx` › the 6th to 10th wrong PINs give 1 min, 5 min, 15 min, 1 h and 1 h                                              | green       |
| P2-19 | Unit        | `i18n` › counts the attempts left in the singular and the plural                                                       | green       |
| P2-19 | E2E         | `app-lock-forgot-pin.yaml` › 5 wrong PINs, then the 30 s Lockout                                                       | see Maestro |
| P2-20 | Unit        | `lockout` › is locked out until the end, exclusive (29 999 ms locked, 30 000 ms free)                                  | green       |
| P2-20 | Integration | `lock-screen` › 5th wrong PIN: keypad disabled with a countdown; still disabled at 29 999 ms, enabled at 30 000 ms     | green       |
| P2-20 | Integration | `ctx` › refuses even the right PIN during a Lockout                                                                    | green       |
| P2-20 | Integration | `ctx` › a successful Biometric Unlock … even during a Lockout                                                          | green       |
| P2-20 | Integration | `lock-screen` › Biometric Unlock works during a Lockout                                                                | green       |
| P2-20 | Integration | `ctx` › never deletes anything after many wrong PINs                                                                   | green       |
| P2-21 | Unit        | `lockout` › restarts the current step from now when the clock moved back beyond it                                     | green       |
| P2-21 | Unit        | `lockout` › keeps the stored end when the clock did not move back                                                      | green       |
| P2-21 | Integration | `ctx` › moving the clock back restarts the current step (at the next attempt and at the next start)                    | green       |
| P2-22 | Integration | `lock-screen` › Forgot PIN opens the confirmation; cancelling changes nothing                                          | green       |
| P2-23 | Integration | `lock-screen` › Reset wallet runs the Wallet Reset and shows onboarding                                                | green       |
| P2-23 | Integration | `lock-screen` › a failed Wallet Reset keeps the Lock Screen and lets the user try again                                | green       |
| P2-23 | E2E         | `app-lock-forgot-pin.yaml` › Forgot PIN, Reset wallet, onboarding                                                      | see Maestro |
| P2-24 | Integration | `recovery` › App Lock on, right PIN in the prompt: shows the words                                                     | green       |
| P2-24 | Integration | `verify` › App Lock on: asks for authentication before reading the Recovery Phrase                                     | green       |
| P2-24 | Integration | `app-lock-screen` › (the three P2-4 rows)                                                                              | green       |
| P2-24 | E2E         | `app-lock.yaml` › open the backup and check the PIN is asked                                                           | see Maestro |
| P2-25 | Integration | `settings-tab` › Sign Out runs the Wallet Reset without asking for the PIN                                             | green       |
| P2-25 | Integration | `summary` (Part 1) › sends without any App Lock provider or prompt                                                     | green       |
| P2-26 | Integration | `lock-screen` › shows Cancel; Cancel resolves false                                                                    | green       |
| P2-26 | Integration | `lock-screen` › the right PIN resolves true                                                                            | green       |
| P2-26 | Integration | `lock-screen` › the Android back button cancels the prompt, and does nothing on the Lock Screen                        | green       |
| P2-26 | Integration | `ctx` › authorizeSensitiveAction with App Lock on: the right PIN resolves true, cancel resolves false                  | green       |
| P2-26 | Integration | `ctx` › Biometric Unlock confirms a Sensitive Action                                                                   | green       |
| P2-26 | Integration | `ctx` › locking while a prompt is open resolves the Sensitive Action false                                             | green       |
| P2-27 | Unit        | `biometrics` › phone authentication allows the Device Passcode and asks for strong biometrics                          | green       |
| P2-27 | Unit        | `biometrics` › detects a phone without screen lock                                                                     | green       |
| P2-27 | Integration | `ctx` › App Lock off: the Recovery Phrase asks for phone authentication with the Device Passcode fallback and strong   | green       |
| P2-27 | Integration | `ctx` › App Lock off, no screen lock: resolves true without a prompt                                                   | green       |
| P2-27 | Integration | `ctx` › App Lock off: the other Sensitive Actions have nothing to ask                                                  | green       |
| P2-27 | Integration | `recovery` › App Lock off, phone with a screen lock: phone authentication, then the words                              | green       |
| P2-27 | Integration | `recovery` › App Lock off, phone without a screen lock: the words without a prompt                                     | green       |
| P2-28 | Unit        | `grant` › holds at 4 min 59 s and has expired at 5 min                                                                 | green       |
| P2-28 | Unit        | `grant` › is not valid without an authentication, or when the clock moved back                                         | green       |
| P2-28 | Integration | `ctx` › the Recovery Phrase grant holds at 4 min 59 s, has expired at 5 min, and is cleared by background              | green       |
| P2-28 | Integration | `ctx` › unlocking the Lock Screen does not grant the Recovery Phrase                                                   | green       |
| P2-28 | Integration | `verify` › after the Recovery Phrase screen, one authentication covers both screens                                    | green       |
| P2-29 | Integration | `recovery` › App Lock on, prompt cancelled: goes back and never reads the Recovery Phrase                              | green       |
| P2-29 | Integration | `recovery` › App Lock off, phone authentication failed: goes back and never reads the Recovery Phrase                  | green       |
| P2-29 | Integration | `verify` › prompt cancelled: goes back and never reads the Recovery Phrase                                             | green       |
| P2-29 | Unit        | `biometrics` › a cancelled, failed or broken prompt resolves false                                                     | green       |
| P2-30 | Unit        | `biometrics` › Android: available only with BIOMETRIC_STRONG enrolled                                                  | green       |
| P2-30 | Unit        | `biometrics` › iOS: available with Face ID or Touch ID enrolled                                                        | green       |
| P2-30 | Integration | `app-lock-screen` › shows Biometric Unlock with BIOMETRIC_STRONG (Android) and Face ID (iOS)                           | green       |
| P2-31 | Unit        | `biometrics` › unavailable with BIOMETRIC_WEAK, SECRET, NONE or without hardware                                       | green       |
| P2-31 | Unit        | `biometrics` › unavailable when the native module throws                                                               | green       |
| P2-31 | Integration | `app-lock-screen` › hides Biometric Unlock with only weak biometrics                                                   | green       |
| P2-31 | Integration | `ctx` › cannot turn Biometric Unlock on without strong biometrics                                                      | green       |
| P2-32 | Unit        | `biometrics` › the Biometric Unlock prompt has disableDeviceFallback: true and strong                                  | green       |
| P2-32 | Integration | `lock-screen` › opens the biometric prompt automatically when it appears, without the Device Passcode                  | green       |
| P2-33 | Integration | `ctx` › Biometric Unlock becomes unavailable when the biometrics are removed (re-checked on resume)                    | green       |
| P2-33 | Integration | `lock-screen` › shows the biometric button only when Biometric Unlock is on and available                              | green       |
| P2-33 | Integration | `app-lock-screen` › shows Biometric Unlock as unavailable when it is on but the biometrics were removed                | green       |
| P2-34 | Integration | `reset` › deletes the five App Lock keys and appLockCardDismissed, on top of the existing Sign Out steps               | green       |
| P2-34 | Integration | `ctx` › resetAppLock deletes the five keys and unlocks                                                                 | green       |
| P2-34 | Integration | `settings-tab` › Sign Out runs the Wallet Reset without asking for the PIN                                             | green       |
| P2-34 | Integration | `lock-screen` › Reset wallet runs the Wallet Reset and shows onboarding                                                | green       |

### Cross-cutting

| Rule | Level | Test file › test name | Status |
| --- | --- | --- | --- |
| Storage table (five keys) | Unit | `storage` › reads, writes and deletes exactly the five App Lock keys | green |
| Storage table (five keys) | Unit | `storage` › stores Biometric Unlock as "true" or absent, and a reset count as absent | green |
| Storage table (five keys) | Unit | `storage` › reads an empty store as App Lock off…; reads corrupted values as no PIN, zero and no Lockout | green |
| Load failures | Integration | `ctx` › a secure store failure at load leaves App Lock off and still ends the load; unmounting during the load changes nothing | green |
| PIN hash | Unit | `pin` › the hash is the hex SHA-256 of salt + PIN, and is not the PIN | green |
| PIN hash | Unit | `pin` › two salts give two hashes for the same PIN; creates a salt of 16 random bytes, in hex | green |
| PIN hash | Unit | `pin` › verifies the right PIN and refuses a wrong one | green |
| PIN hash | Integration | `ctx` › enabling stores a salted hash that is not the PIN; enabling twice uses two salts | green |
| Secrets stay out of logs | Integration | `ctx`, `lock-screen`, `app-lock-screen`, `set-pin`, `recovery`, `verify`, `settings-tab`, `reset` › `afterEach` asserts no `console.*` call contains the PIN or the Recovery Phrase | green |
| Translations (FR says "portefeuille") | Unit | `i18n` › EN and FR have the same appLock keys; FR uses the glossary terms and says "portefeuille", never "wallet"; EN uses the spec copy | green |

### Maestro

| Flow                                  | Covers                                       | Status                                                            |
| ------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `.maestro/app-lock.yaml`              | P2-3, P2-4, P2-5, P2-9, P2-19 (error), P2-24 | not run locally (syntax checked); runs in `e2e-android` on the PR |
| `.maestro/app-lock-forgot-pin.yaml`   | P2-19, P2-20, P2-22, P2-23                   | not run locally (syntax checked); runs in `e2e-android` on the PR |
| `.maestro/wallet-backup-restore.yaml` | P2-7 (card after the backup)                 | not run locally (syntax checked); runs in `e2e-android` on the PR |

Not run locally: the only local emulator (arm64 `Medium_Phone_API_36.0`, no screen lock) had 300 MB free, too little to install the 108 MB release APK, and freeing space meant deleting apps or data on it. `maestro check-syntax` passes on the five changed files.

### Mutations seen red

Each line was changed on its own, the App Lock suites were run, then the line was restored.

| Mutation | Caught by (among others) |
| --- | --- |
| `ATTEMPTS_BEFORE_LOCKOUT` 5 → 6 | `ctx` › counts wrong PINs and starts a 30 s Lockout at the 5th (+ 7 more) |
| Lockout 30 s → 31 s | `lock-screen` › 5th wrong PIN: … enabled at 30 000 ms; `lockout` › is locked out until the end, exclusive |
| Lockout 1 min → 2 min, 5 min → 6 min, 15 min → 16 min, 1 h → 2 h, 10th PIN → 2 h | `lockout` › 5th to 10th wrong PIN; `ctx` and `lock-screen` › the 6th to 10th wrong PINs give … |
| Auto-lock 30 s → 31 s, and → 29 s | `auto-lock` and `ctx` › 29 999 ms in background stays unlocked, 30 001 ms locks |
| `inactive` counts like `background` | `ctx` › 10 minutes in inactive does not lock; `auto-lock` › never locks without a background timestamp |
| Recovery Phrase grant 5 min → 6 min, and → 4 min | `grant` › holds at 4 min 59 s and has expired at 5 min; `ctx` › the Recovery Phrase grant holds … |
| `background` no longer clears the grant | `ctx` › the Recovery Phrase grant … is cleared by background |
| Biometric Unlock prompt `'strong'` → `'weak'` | `biometrics` › the Biometric Unlock prompt has disableDeviceFallback: true and strong; `lock-screen` › opens the biometric prompt automatically … |
| Phone authentication `'strong'` → `'weak'` | `biometrics` › phone authentication …; `recovery` › App Lock off, phone with a screen lock … |
| Availability accepts weak biometrics | `biometrics` › Android: available only with BIOMETRIC_STRONG; `app-lock-screen` › hides Biometric Unlock with only weak biometrics |
| Biometric Unlock `disableDeviceFallback: true` → `false` | `biometrics`, `lock-screen`, `set-pin`, `app-lock-screen`, `ctx` (6 tests) |
| Phone authentication `disableDeviceFallback: false` → `true` | `biometrics` › phone authentication allows the Device Passcode …; `recovery` |
| Cold start always locked; auto-lock without App Lock | `ctx` › never locks on a cold start without a PIN; never locks without App Lock; `lock-screen` › never shows on a cold start without a PIN |
| Home card ignores App Lock on / dismissed / backed up | `home-card` › exactly one of the 8 combinations; `card` › the matching combination |
| Storage writes `'0'`; grant valid when the clock moved back; native errors propagate; FR says "wallet"; no plural form | the matching `storage`, `grant`, `biometrics`, `i18n`, `lock-screen` test |
| Clock-back rule `>` → `>=` | none: equivalent mutant (at equality, restarting gives the same end) |
