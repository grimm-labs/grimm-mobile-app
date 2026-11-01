# Grimm App

A self-custodial Bitcoin wallet for Android and iOS. One Recovery Phrase on the device controls both a Lightning wallet and an on-chain wallet.

## Language

### Wallet

**Recovery Phrase**: The 12 words that control both wallets. Whoever has them owns the funds, and they are the only way to restore the wallets. _Avoid_: seed, seed phrase, mnemonic, secret phrase

**Wallet Reset**: Deleting both wallets and the user's wallet data from the device. Without the Recovery Phrase, the funds are lost. _Avoid_: logout, sign out (the UI still says "Sign Out")

### Payments

**Amount**: The sum the recipient receives, without the Network Fee. _Avoid_: value, sent amount

**Network Fee**: What the sender pays to the Bitcoin network, on top of the Amount, to have an on-chain transaction confirmed. _Avoid_: miner fee, transaction fee

**Total**: The Amount plus the Network Fee: everything that leaves the sender's wallet for one transaction. _Avoid_: total amount, sent

### Access

**App Lock**: An optional protection, off until the user creates a PIN, that keeps the app hidden until the user proves they are the owner. _Avoid_: security, passcode lock

**Lock Screen**: What covers the whole app while it is locked, asking for the PIN or Biometric Unlock. _Avoid_: PIN screen, login screen

**PIN**: A numeric code that belongs to Grimm App alone, chosen by the user to unlock the app. _Avoid_: password, passcode, code

**Device Passcode**: The code that unlocks the phone itself. Grimm App never accepts it in place of the PIN. _Avoid_: PIN, phone PIN

**Biometric Unlock**: An optional shortcut that accepts the phone's biometrics instead of typing the PIN. It requires a PIN. _Avoid_: Face ID, Touch ID, fingerprint (these are methods, not the feature)

**Sensitive Action**: An action that asks for the PIN or Biometric Unlock again, even when the app is already unlocked. _Avoid_: protected action, secure action

**Lockout**: A waiting period, after too many wrong PINs, during which the app refuses any PIN. It never deletes anything. _Avoid_: ban, block, wipe
