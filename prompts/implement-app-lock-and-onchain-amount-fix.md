# Implement the on-chain amount fix and App Lock

You implement [docs/specs/onchain-amount-fix-and-app-lock.md](../docs/specs/onchain-amount-fix-and-app-lock.md) on the branch `feat/app-lock-and-onchain-amount-fix`, in two parts: Part 1 (on-chain send amount fix), then Part 2 (App Lock).

Sources of truth, in this order:

- **The spec** for behaviour. Its numbered items are the contract: Part 1 "Behaviour" items 1–6 (`P1-1`…`P1-6`) and Part 2 items 1–34 (`P2-1`…`P2-34`).
- **[ADR 0001](../docs/adr/0001-app-lock-is-a-ui-gate.md)** for why App Lock is a UI gate.
- **[GLOSSARY.md](../GLOSSARY.md)** for vocabulary. Use its terms in identifiers, test names and UI copy: `Recovery Phrase`, `Lock Screen`, `Lockout`, `Sensitive Action`, `Wallet Reset`…
- **[AGENTS.md](../AGENTS.md)** for repository conventions, commands, the Jest rules (stable `mockT`, mocking Breez and BDK, `mock`-prefixed factory variables) and the Maestro rules. Read its "Unit tests (Jest)" and "E2E tests (Maestro)" sections before writing any test.
- **[.maestro/README.md](../.maestro/README.md)** before writing a flow.

When the spec is silent, or contradicts the code, stop and ask the user, with the answer you recommend. Record the answer in the spec before coding it.

Leave every change in the working tree: the user reviews and commits.

## How to work

Work test-first, one spec item at a time:

1. Write the test for the item.
2. Run it and watch it go **red** for the reason the item describes. A test that is red because of a typo or a missing import does not count.
3. Write the smallest code that turns it **green**.
4. Refactor while it stays green.

Run single files with `pnpm test <path>` while iterating.

## Test levels

Every test belongs to one level. Name the level in the traceability table.

- **Unit (Jest)**: pure functions, no React. All the App Lock rules live in `src/lib/app-lock/*` as pure functions that take `now` (and the stored state) as arguments, so the tests control time without waiting.
- **Integration (Jest)**: the real `AppLockProvider`, the real components and screens, and the real `src/lib/app-lock` logic, rendered together. Fake only the native boundaries:
  - `expo-secure-store`: an in-memory store that survives unmounting and remounting the provider. A remount stands for an app restart.
  - `expo-local-authentication`: a controllable fake (hardware, enrolled level, result of `authenticateAsync`, recorded options).
  - `expo-crypto`: backed by Node's `crypto` (`sha256`, `randomBytes`), so the PIN hash is real.
  - `AppState`: the emitter pattern of `src/components/__tests__/privacy-overlay.test.tsx`.
  - `expo-splash-screen`, `expo-router`, and the Breez and BDK contexts, as AGENTS.md describes.

  Put the shared fakes and a `renderWithAppLock` helper in `src/lib/app-lock/__tests__/helpers/`, the way `src/lib/bdk/__tests__/helpers/mock-bdk-rn` serves the BDK tests.

- **E2E (Maestro)**: the flows the spec lists, in `.maestro/`, using the testIDs the spec lists.

## Step 1: traceability table

Read the spec, the ADR, the glossary and the existing tests you will extend:

- `src/app/send/__tests__/transaction-details.test.tsx`
- `src/components/__tests__/privacy-overlay.test.tsx`
- `src/lib/context/__tests__/bdk-context.test.tsx`

Then create `docs/specs/onchain-amount-fix-and-app-lock.test-plan.md`, with one row per spec item, `P1-1` to `P2-34`: item, test level(s), test file › test name, status.

This step is done when every item has at least one planned automated test that would go red if the item were broken. An item that only one test covers in part gets more rows until the whole item is covered. The spec's manual checklist is extra, for real hardware; it does not replace an automated test. Keep the table up to date as you go: it is the final report's backbone.

## Step 2: Part 1, the on-chain send amount fix

Implement Part 1 test-first, in `src/app/send-onchain/__tests__/summary.test.tsx` (integration level: the real screen, with `useBdk`, `useBitcoin` and `expo-router` mocked).

The tests must pin down:

- `sendTransaction` receives the entered Amount, in sats, with the selected fee rate, for an Amount entered in sats and for one entered in BTC.
- `transaction-result` receives the Amount, never the Total.
- The slider is disabled while the Network Fee estimation is pending.
- A rejected estimation shows the insufficient-funds message when BDK reports insufficient funds, and the generic message otherwise. The slider stays disabled in both cases.
- A rejected send shows the send error, does not navigate, and the slider works again for a retry.

Part 1 is done when:

- every `P1-*` row is green;
- `pnpm lint`, `pnpm type-check`, `pnpm lint:translations` and `pnpm test` pass;
- **every `P1-*` test has been seen red**: put back the `1000` and the `totalSats` one at a time, check that a test fails each time, then restore the fix.

**Checkpoint.** Stop and report Part 1 to the user (format below), then wait. The user may commit it and open its PR before Part 2.

## Step 3: Part 2, App Lock

Follow the spec's "Changes" section. Install `expo-local-authentication` first, so the Jest fakes can mock a real module.

**Native projects.** `pnpm prebuild:development` needs `.env.development` and `credentials/firebase/google-services.json` (see AGENTS.md). Then run `git diff --stat android ios`. Keep only what `expo-local-authentication` brings: `NSFaceIDUsageDescription`, the biometric permissions, `Podfile.lock`. Restore every other file. If prebuild cannot run here, make those three edits by hand and tell the user.

Build bottom-up, each layer green before the next:

1. Pure rules (`src/lib/app-lock/*`).
2. `AppLockProvider`.
3. `PinPad`, then the Lock Screen.
4. The settings screens, the home card, the Recovery Phrase gate.
5. `useWalletReset`.
6. The root layout and the splash.
7. Translations and testIDs.

The tests must pin down these cases, which are the easiest to get wrong:

- **Lockout boundaries.**
  - 4 wrong PINs show "1 attempt left".
  - The 5th wrong PIN starts a 30 s Lockout. At 29 999 ms the keypad is still disabled; at 30 000 ms it is enabled again.
  - The 6th, 7th, 8th, 9th and 10th wrong PINs give 1 min, 5 min, 15 min, 1 h and 1 h.
  - A correct PIN and a successful Biometric Unlock both reset the count.
  - The count and the Lockout survive a provider remount.
  - Moving the clock back restarts the current step.
  - During a Lockout, Biometric Unlock still works.
- **Auto-lock boundaries.**
  - 29 999 ms in `background` does not lock; 30 001 ms does.
  - 10 minutes in `inactive` does not lock.
  - The iOS sequence `inactive` → `background` → `active` is measured from the `background` event.
  - A cold start with a PIN starts locked; a cold start without a PIN never shows the Lock Screen.
- **Splash.** `SplashScreen.hideAsync` is not called before `isAppLockLoaded` is true.
- **The Lock Screen preserves the screen below.** Render a stateful screen under it (for example, a typed input). Lock, unlock, and assert the state is still there.
- **PIN setup.**
  - Entries auto-submit at the 6th digit, and the delete key works.
  - Two different entries show the error and start over at the first entry.
  - The stored hash is not the PIN, and enabling twice uses two different salts.
  - Changing the PIN accepts the new PIN and refuses the old one.
- **Sensitive Actions.**
  - With App Lock on, cancelling the prompt resolves `false`. The Recovery Phrase screen then goes back, and **the Recovery Phrase is never read from the secure store**: assert that `getItemAsync('seedPhrase')` was not called. Apply the same to `verify.tsx`.
  - A wrong PIN in the prompt increments the same count as the Lock Screen.
  - The Recovery Phrase grant still holds at 4 min 59 s, has expired at 5 min, and is cleared by a `background` event.
  - Changing the PIN, toggling Biometric Unlock and turning App Lock off each require authentication. Cancelling leaves the setting unchanged.
- **App Lock off.**
  - When the phone has a screen lock, viewing the Recovery Phrase calls `authenticateAsync` with the Device Passcode fallback allowed and `biometricsSecurityLevel: 'strong'`.
  - When the phone has no screen lock, the words are shown without a prompt.
- **Biometrics.**
  - On Android, an enrolled level of `BIOMETRIC_WEAK` hides the option, and `BIOMETRIC_STRONG` shows it.
  - On iOS, Face ID shows it.
  - The Lock Screen opens the prompt automatically, with `disableDeviceFallback: true`.
  - A failed or cancelled biometric prompt does not increment the count.
  - After the biometrics are removed from the phone, only the PIN is offered.
- **Home card.** Test every combination of (App Lock on/off) × (dismissed yes/no) × (Recovery Phrase backed up yes/no): the card shows in exactly one. Tapping it opens `settings/app-lock`. Closing it persists across a remount.
- **Wallet Reset.**
  - Sign Out and Forgot PIN both go through `useWalletReset`.
  - It deletes the five App Lock keys and `appLockCardDismissed`.
  - Turning App Lock off deletes the five keys.
  - Cancelling the Forgot PIN confirmation changes nothing.
- **Secrets stay out of logs.** Spy on `console.*` across the App Lock suites, and assert that no call contains the PIN or the Recovery Phrase.

Write the two Maestro flows and the `wallet-backup-restore.yaml` assertion the spec lists, following `.maestro/README.md`.

- If an arm64 device or emulator **without a screen lock** is available, run them against a release build, as AGENTS.md describes.
- Otherwise, say so in the report: they will run in the `e2e-android` workflow on the pull request.

Update the docs the spec lists under "Docs to update".

Part 2 is done when:

- every `P2-*` row is green, at the level the table names;
- `pnpm lint`, `pnpm type-check`, `pnpm lint:translations` and `pnpm test:ci` pass;
- the coverage that `pnpm test:ci` writes to `coverage/coverage.txt` is:
  - **at least 95 %** lines and branches for `src/lib/app-lock/**` and `src/lib/context/app-lock-context.tsx`;
  - **at least 85 %** for the new components and screens;
- **the rules have been seen red**: change each of these constants or conditions one at a time, check that at least one test fails each time, then restore it:
  - the 5-attempt threshold;
  - each Lockout duration;
  - the 30 s auto-lock delay;
  - the 5 min Recovery Phrase grant;
  - the `background`-only condition;
  - `'strong'`;
  - `disableDeviceFallback`.

## Report

Report at the checkpoint and at the end, in this order:

1. **What changed**, file by file, in one line each.
2. **The traceability table**: a link, plus any row that is not green and why.
3. **Commands run**, with their results: the test counts, and the coverage figures above.
4. **The red checks**: which mutations you made, and which test caught each one.
5. **The Maestro flows**: run (on which device, with the result) or not run.
6. **Deviations from the spec**, with the user's answer for each, and open questions.
