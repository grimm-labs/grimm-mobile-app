# Maestro E2E tests

End-to-end tests for the Android app, written with [Maestro](https://docs.maestro.dev). They run in GitHub Actions (`.github/workflows/e2e-android.yml`) on every pull request and every push to `master`.

## Layout

```text
.maestro/
  config.yaml                    # flows: ['*'] → every flow at the root of .maestro/ is a test
  <area>-<feature>.yaml          # one test per file (name + tags in the header)
  subflows/                      # reusable steps, never run on their own
    launch-fresh-app.yaml        # clearState + launch + wait for the onboarding screen
    create-wallet.yaml           # fresh install → Get Started → create a seed → Home
    wait-for-lightning.yaml      # wait until Breez is connected (Settings › Networks), back to Home
    open-settings-item.yaml      # Settings tab → scroll to a row → open it (env ITEM_ID)
    read-recovery-phrase.yaml    # read the 12 words of the backup screen into output.words
    verify-recovery-phrase.yaml  # answer the 4 random words of the verification screen
    dismiss-system-dialogs.yaml  # close "… isn't responding" dialogs on slow CI emulators
```

## Writing a flow

- Header: `appId: ${APP_ID}`, a `name:` and `tags:` (area tags such as `wallet`, `settings`, `receive`, `send`, `lightning`, `onchain`).
- Every flow starts from a clean install: `runFlow: subflows/launch-fresh-app.yaml`, or `runFlow: subflows/create-wallet.yaml` when it needs a wallet. Flows never depend on each other.
- Select elements by `id` (the React Native `testID`). Assert on text only for messages that are the point of the test (errors, flash messages), in English.
- testIDs are kebab-case and prefixed with the screen (`receive-amount-continue`, `settings-country`). Buttons and inputs derive `<id>-label` / `<id>-error`. Selection lists use `<prefix>-option-<value>` for a row and `<prefix>-option-<value>-selected` for the checkmark.
- Anything that needs Breez (Lightning invoices, address parsing, LN address availability) must run after `subflows/wait-for-lightning.yaml`.
- Use `extendedWaitUntil` after navigation and network calls; plain `assertVisible` only right after a local UI change.
- Never register anything for real: the LN address flow cancels the confirmation sheet.
- On Android `hideKeyboard` presses back: never use it while a bottom sheet is open (back closes the sheet, or the screen if the keyboard is already hidden). In a sheet, keep the keyboard open until the submit button: when the keyboard closes the sheet slides down, and a tap during that animation lands on the backdrop and closes the sheet.
- Flash messages last 1.5–4 s and a tap can take longer than that on the CI emulator. Only assert the long error messages (with `waitToSettleTimeoutMs: 500` on the tap). Check a copy by pasting it (`longPressOn` the field, then `tapOn: 'Paste'`).
- Wait for the closing animation (`waitForAnimationToEnd`) before opening another bottom sheet.
- Inputs below the fold need `scrollUntilVisible` (with `centerElement: true` when the label above must stay visible).

## Running

```sh
# Local (arm64 device or emulator with a release build installed, see AGENTS.md)
maestro test .maestro/ -e APP_ID=com.grimm.labs.app.development
maestro test .maestro/settings-country.yaml -e APP_ID=com.grimm.labs.app.development
maestro test .maestro/ -e APP_ID=com.grimm.labs.app.development --include-tags settings

# CI, manual run on a branch (reuse the APK of a previous run when only flows changed)
gh workflow run e2e-android.yml --ref <branch>
gh workflow run e2e-android.yml --ref <branch> -f apk-run-id=<run id> -f include-tags=settings
```

## Coverage

Features that need a funded wallet (sending, transaction lists and details, transaction notes, unclaimed deposits) or a real camera (scanning a QR code) are out of scope.

| Area         | Feature                                                                                                                            | Flow                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Onboarding   | Onboarding screen, Need help screen                                                                                                | `onboarding`, `need-help`  |
| Wallet       | Create a new wallet (Home with an empty balance and the backup banner)                                                             | `wallet-create`            |
| Wallet       | Import: word counter, disabled button, invalid phrase rejected                                                                     | `wallet-import-validation` |
| Wallet       | Backup: warning (cancel/proceed), phrase display and copy, wrong words rejected, verification, banner gone, no second verification | `wallet-backup-restore`    |
| Wallet       | Log out and restore the same wallet from its recovery phrase                                                                       | `wallet-backup-restore`    |
| Wallet       | Bitcoin and Lightning account details (balance, hide toggle, empty history, Send/Receive, LN address row)                          | `wallet-details`           |
| Home         | Hide/show balance, Send and Receive sheets, tabs                                                                                   | `home`                     |
| Transactions | Empty history and every filter                                                                                                     | `home`                     |
| Receive      | Lightning: keypad, delete, note add/clear, invoice (amount, note, QR, countdown), copy, close                                      | `receive-lightning`        |
| Send         | Lightning: paste an invoice → payment details, insufficient balance                                                                | `receive-lightning`        |
| Receive      | On-chain: address, copy (pasted in the send screen), address settings (amount + note), new address                                 | `receive-onchain`          |
| Receive      | Lightning account on-chain deposit address                                                                                         | `receive-onchain`          |
| Send         | Lightning: empty input, invalid input, Bitcoin address refused                                                                     | `send-lightning`           |
| Send         | On-chain: empty and invalid address, valid address, fee options, insufficient balance                                              | `send-onchain`             |
| Scan         | Camera screen and close; camera permission denied                                                                                  | `scan-qr`                  |
| Settings     | Network switch to testnet (warning banner) and back to mainnet (confirmation, cancel)                                              | `settings-network`         |
| Settings     | Esplora indexer: default in use, select, save, reconnect                                                                           | `settings-esplora`         |
| Settings     | Country: search, no result, select, fiat currency on Home                                                                          | `settings-country`         |
| Settings     | Language: English ↔ French                                                                                                         | `settings-language`        |
| Settings     | Bitcoin unit: BTC ↔ SATS on Home                                                                                                   | `settings-bitcoin-unit`    |
| Settings     | Invoice expiry: options, applied to a new invoice                                                                                  | `settings-invoice-expiry`  |
| Settings     | LN address: empty state, validation messages, random name, availability check (cancelled)                                          | `settings-ln-address`      |
| Settings     | Hide balance and block screenshots switches                                                                                        | `settings-security`        |
| Settings     | Notifications screen, appearance (system/dark/light)                                                                               | `settings-preferences`     |
| Settings     | Breez SDK details, About, Help & Support                                                                                           | `settings-about`           |
| Settings     | Log out: warning, cancel, back up first, confirm                                                                                   | `logout`                   |
