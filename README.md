[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

<h1 align="center">
  <img alt="Grimm App Logo" src="./assets/icon.png" width="124px" style="border-radius:10px"/><br/>
  Grimm App
</h1>

<p align="center">
  <strong>A self-custodial Bitcoin wallet for the modern era</strong><br/>
  Taking control of your Bitcoin, one transaction at a time.
</p>

## About Grimm App

Grimm App is a self-custodial Bitcoin wallet that empowers users to take full control of their Bitcoin while maintaining ease of use. Built on the principle that "not your keys, not your coins," Grimm App ensures that you—and only you—have access to your funds at all times.

Currently supporting Lightning Network payments via the Breez SDK, Grimm App is actively expanding to include comprehensive on-chain Bitcoin and Liquid Network capabilities. Our mission is to create a wallet that serves both newcomers to Bitcoin and experienced users who demand advanced features and maximum control.

Following the cypherpunk ethos, Grimm App is fully open-source, auditable, and trustless. We believe that financial sovereignty should be accessible to everyone, and that transparency in code is essential for building trust in Bitcoin software.

## Why Grimm App?

**Self-Custody First**: Unlike custodial wallets and exchanges, Grimm App generates and stores your private keys exclusively on your device. This means no third party can freeze, confiscate, or lose your Bitcoin.

**Lightning Native**: Experience instant Bitcoin payments with minimal fees through our Lightning Network integration. Send and receive payments in seconds, not hours.

**Future-Ready**: With upcoming support for on-chain Bitcoin and Liquid Network, Grimm App is designed to be your all-in-one Bitcoin solution, capable of handling everything from small everyday payments to large, secure transfers.

**Privacy-Focused**: We don't collect user data, don't require KYC, and implement best practices for maintaining your financial privacy.

**Open Source**: Every line of code is open for inspection. We believe in radical transparency and community-driven development.

## Current Features

### Lightning Network Payments

**Instant Transactions via Breez SDK**

- Send and receive Bitcoin instantly over the Lightning Network
- Minimal transaction fees, typically less than a penny
- Perfect for everyday purchases and micro-transactions
- QR code scanning for easy payment initiation

**Lightning Network Benefits**

- Near-instant settlement (payments confirm in seconds)
- Extremely low fees regardless of Bitcoin network congestion
- Enhanced privacy through payment channel routing
- Scalable solution for global Bitcoin adoption

### Wallet Basics

**Non-Custodial Architecture**

- Private keys generated securely on your device using industry-standard cryptographic libraries
- Keys never transmitted over the network or stored on external servers
- You maintain complete control over your Bitcoin at all times

**User-Friendly Interface**

- Clean, intuitive design suitable for both beginners and experts
- Clear transaction history with detailed information
- Real-time balance updates
- Support for both Bitcoin and Satoshi denominations
- Dark mode support for comfortable viewing

### Wallet Security

**Multi-Layer Security Approach**

- Private keys stored in platform-specific secure storage (Keychain on iOS, Keystore on Android)
- Keys only accessed when absolutely necessary (signing transactions, viewing backup)
- Secure generation of cryptographic randomness for key creation

**Access Control** (Coming Soon)

- Optional PIN protection (6 digits)
- Biometric authentication (fingerprint, Face ID)
- Auto-lock after inactivity
- Configurable security settings based on user preference

## Core Dependencies and Technology Stack

### Bitcoin and Lightning

- **[Breez SDK](https://github.com/breez/breez-sdk)**: Production-ready Lightning Network implementation
- **[BDK (Bitcoin Dev Kit)](https://github.com/bitcoindevkit/bdk)**: Modern Bitcoin wallet library (planned)
- **[LWK (Liquid Wallet Kit)](https://github.com/Blockstream/lwk)**: Liquid Network wallet functionality (planned)

### Mobile Development

- **[React Native](https://reactnative.dev/)**: Cross-platform mobile framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript for robust code
- **[Obytes Starter](https://starter.obytes.com)**: Production-ready React Native template

### State Management and Data

- Modern React patterns with hooks and context
- Persistent storage for wallet data and preferences
- Secure storage for sensitive cryptographic material

## Requirements

### Development Environment

**General Requirements**

- [React Native dev environment](https://reactnative.dev/docs/environment-setup) - Follow the "React Native CLI Quickstart" guide
- [Node.js LTS release](https://nodejs.org/en/) (v18 or higher recommended)
- [Git](https://git-scm.com/) for version control
- [Pnpm](https://pnpm.io/installation) for fast, efficient package management

**Platform-Specific Requirements**

_macOS (for iOS development)_

- Xcode 14 or higher
- CocoaPods (`sudo gem install cocoapods`)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall) for file watching
- iOS Simulator or physical iOS device

_Windows/macOS/Linux (for Android development)_

- Android Studio with Android SDK
- Java Development Kit (JDK) 11 or higher
- Android emulator or physical Android device
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall) (macOS/Linux only)

**Recommended Tools**

- [Cursor](https://www.cursor.com/) or [VS Code](https://code.visualstudio.com/download)
  - ⚠️ Install all recommended extensions from `.vscode/extensions.json`
  - These extensions provide linting, formatting, and TypeScript support
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger) for debugging
- [Flipper](https://fbflipper.com/) for advanced debugging and inspection

## Getting Started

### Installation

1. **Clone the repository**

```sh
git clone https://github.com/grimm-labs/grimm-mobile-app.git
cd grimm-mobile-app
```

2. **Install dependencies**

```sh
pnpm install
```

3. **iOS Setup** (macOS only)

```sh
cd ios && pod install && cd ..
```

4. **Environment Configuration**

```sh
cp .env.example .env
# Edit .env with your configuration
```

### Running the App

**iOS Development**

```sh
# Run on iOS simulator
pnpm ios

# Run on specific iOS device
pnpm ios --device "Your Device Name"

# Run on physical device with specific scheme
pnpm ios --scheme "Grimm" --device "Your Device"
```

**Android Development**

```sh
# Run on Android emulator or connected device
pnpm android

# Run on specific variant
pnpm android --variant=debug
```

**Development Tips**

```sh
# Start Metro bundler manually
pnpm start

# Clear cache if you encounter issues
pnpm start --reset-cache

# Run TypeScript type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Documentation

### General Documentation

- **[Rules and Conventions](https://starter.obytes.com/getting-started/rules-and-conventions/)**: Coding standards and best practices
- **[Project Structure](https://starter.obytes.com/getting-started/project-structure)**: Detailed explanation of folder organization
- **[Environment Variables](https://starter.obytes.com/getting-started/environment-vars-config)**: Configuration management

### UI Development

- **[UI and Theming](https://starter.obytes.com/ui-and-theme/ui-theming)**: Styling approach and theme customization
- **[Components](https://starter.obytes.com/ui-and-theme/components)**: Component library and usage
- **[Forms](https://starter.obytes.com/ui-and-theme/Forms)**: Form handling and validation

### Advanced Topics

- **[Data Fetching](https://starter.obytes.com/guides/data-fetching)**: API integration patterns
- **[State Management](https://starter.obytes.com/guides/state-management)**: Managing application state
- **[Testing](https://starter.obytes.com/guides/testing)**: Testing strategies and tools

## Roadmap

Suggestions and contributions to this roadmap are welcome through GitHub issues and discussions.

### Phase 1: Lightning Foundation (Current)

- [x] Lightning Network integration via Breez SDK
- [x] Send and receive Lightning payments
- [x] QR code scanning and generation
- [x] Basic wallet security with secure storage
- [x] Transaction history and balance display
- [ ] LNURL support (pay, withdraw, auth)
- [ ] Lightning address support

### Phase 2: On-Chain Bitcoin (In Progress)

- [ ] Native Bitcoin wallet with bech32 addresses
- [ ] Custom fee selection and RBF support
- [ ] UTXO management and coin control
- [ ] Transaction labeling for privacy
- [ ] Batch transactions
- [ ] Multiple wallet support
- [ ] BIP39 passphrase support

### Phase 3: Liquid Network (Planned)

- [ ] Liquid Network wallet integration
- [ ] Confidential transactions
- [ ] Bitcoin <> Liquid submarine swaps
- [ ] Lightning <> Liquid instant swaps
- [ ] Liquid asset support

### Phase 4: Advanced Features

- [ ] Watch-only wallet support
- [ ] Hardware wallet integration (Coldcard, Ledger, Trezor)
- [ ] PSBT creation and signing
- [ ] Air-gapped transaction signing
- [ ] Multi-signature wallet support (future)

### Phase 5: Privacy and Security Enhancements

- [ ] Tor support for network privacy
- [ ] Custom electrum server configuration
- [ ] Coin mixing integration (Whirlpool, JoinMarket)
- [ ] Encrypted cloud backups with key server
- [ ] Biometric authentication
- [ ] Enhanced transaction privacy features

### Phase 6: User Experience

- [ ] Fiat currency conversion and display
- [ ] Transaction fiat value at time of payment
- [ ] Widget support for quick balance check

### Phase 7: Integration and Interoperability

- [ ] Integration with Bitcoin exchanges (optional)
- [ ] Configurable swap providers
- [ ] Support for additional Lightning implementations
- [ ] BOLT12 offers support
- [ ] Nostr integration for social payments

### Long-Term Vision

- [ ] Submarine swap optimization
- [ ] Advanced scripting support
- [ ] Fedimint integration
- [ ] Cashu token support

## Privacy & Security

### Privacy Principles

**No Data Collection**

- We don't collect, store, or transmit any personal information
- No analytics, no tracking, no telemetry
- Your transaction history stays on your device

**Network Privacy**

- Default electrum servers don't keep logs
- Planned Tor support for anonymous blockchain queries
- No IP address logging or correlation

**Transaction Privacy**

- Coin control to avoid address reuse
- Change address detection and management
- Confidential transactions via Liquid Network

### Security Best Practices

**Key Management**

- Keys generated using cryptographically secure random number generation
- BIP39 standard for mnemonic phrases
- BIP32/BIP44 hierarchical deterministic wallet structure
- Optional BIP39 passphrase for additional security layer

**Secure Storage**

- Platform-specific secure enclaves (iOS Keychain, Android Keystore)
- Encryption at rest for all sensitive data
- Memory protection to prevent key extraction
- Secure deletion of sensitive data

**Operational Security**

- Regular security audits (planned)
- Responsible disclosure policy
- Community code review

### Threat Model

**What Grimm App Protects Against**

- ✅ Theft of Bitcoin by malicious apps on your device
- ✅ Server-side theft (we don't hold your keys)
- ✅ Man-in-the-middle attacks (cryptographic verification)
- ✅ Phishing attacks (warnings on suspicious addresses)
- ✅ Accidental loss through proper backup procedures

**What Grimm App Cannot Protect Against**

- ❌ Physical device theft without PIN/biometric lock
- ❌ Malware with root/jailbreak access
- ❌ Loss of seed phrase without backup
- ❌ Social engineering attacks
- ❌ Compromised device before wallet installation

**User Responsibilities**

- Secure your device with a strong PIN/password
- Keep your device updated with latest security patches
- Backup your seed phrase securely (offline, physically)
- Never share your seed phrase with anyone
- Verify recipient addresses before sending
- Be cautious of phishing attempts
