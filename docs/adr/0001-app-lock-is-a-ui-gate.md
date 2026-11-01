# App Lock is a UI gate, the Recovery Phrase stays unencrypted by the PIN

App Lock protects against someone holding the user's unlocked phone, which is the main risk today: anyone could open the app, read the 12 words and empty both wallets. We make App Lock a UI gate. The 12 words stay in expo-secure-store exactly as before, only a salted hash of the PIN is added, and the Breez and BDK wallets start and sync behind the lock screen so the balance is up to date the moment the user unlocks.

## Considered Options

- **Encrypt the 12 words with a key derived from the PIN, or bind them to biometrics** (`requireAuthentication` in expo-secure-store). Rejected for v1:
  - it also protects against reading the phone's storage, but the README already lists rooted, jailbroken or infected devices as threats Grimm App cannot defend against;
  - the wallets could not start before unlock, so every launch would wait for the Breez connection and the BDK sync;
  - changing the PIN would re-encrypt the 12 words, and an interrupted write could corrupt them;
  - every provider that reads the 12 words would change, and existing installs would need a migration.

## Consequences

- The PIN is not a key. Anyone who can read the secure store can read the 12 words without the PIN, as before.
- Encrypting the 12 words remains possible later. It would need its own ADR superseding this one and a migration of existing installs.
