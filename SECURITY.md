# Security Policy

## Reporting a Vulnerability

The Grimm App team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

📧 **security@usegrimm.app**

You can encrypt your message using our PGP key (available on request).

### What to Include

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: The potential impact of the vulnerability (e.g., funds at risk, data exposure)
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Affected version(s)**: Which version(s) of Grimm App are affected
- **Proof of concept**: If possible, include a proof of concept or exploit code
- **Suggested fix**: If you have a suggestion for how to fix the vulnerability

### Response Timeline

| Action                      | Timeline                    |
| --------------------------- | --------------------------- |
| Acknowledgement of report   | Within **48 hours**         |
| Initial assessment          | Within **5 business days**  |
| Status update               | Within **10 business days** |
| Fix deployed (critical)     | Within **30 days**          |
| Fix deployed (non-critical) | Within **90 days**          |

### Scope

The following are **in scope** for security reports:

- **Grimm App** (iOS and Android)
- Seed phrase / private key management
- Transaction signing and broadcasting
- Secure storage implementation
- Network communication security
- Dependencies with known vulnerabilities

The following are **out of scope**:

- Third-party services (Breez SDK, Mempool.space, Yadio API) — please report those directly to the respective projects
- Social engineering attacks
- Physical attacks on user devices
- Issues already reported and acknowledged
- Issues in development/staging environments only

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption of services
- Only interact with accounts you own or with explicit permission
- Do not exploit a security issue for purposes other than verification
- Report vulnerabilities promptly and do not publicly disclose before a fix is available
- Do not engage in extortion or threats

We will not pursue legal action against researchers who follow these guidelines.

### Recognition

We maintain a [Security Hall of Fame](#hall-of-fame) for researchers who responsibly disclose vulnerabilities. With your permission, we will publicly acknowledge your contribution.

### Disclosure Policy

- We follow a **coordinated disclosure** model
- We will work with you to understand and resolve the issue before any public disclosure
- We aim to release a fix before or simultaneously with any public disclosure
- Credit will be given to the reporter unless they prefer to remain anonymous

---

## Supported Versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest release         | ✅        |
| Previous minor release | ✅        |
| Older versions         | ❌        |

We recommend always using the latest version of Grimm App.

---

## Security Best Practices for Users

- **Back up your seed phrase** securely — store it offline in a physically secure location
- **Never share your seed phrase** with anyone, including Grimm App support
- **Keep your device updated** with the latest OS security patches
- **Enable device lock** (PIN, biometrics) on your phone
- **Verify addresses** carefully before sending transactions
- **Download only from official sources** (App Store, Google Play, or our GitHub releases)

---

## Hall of Fame

We thank the following security researchers for their responsible disclosures:

_No submissions yet — be the first!_

---

## Contact

For security-related inquiries: **security@usegrimm.app**

For general questions: Open an issue on [GitHub](https://github.com/grimm-labs/grimm-mobile-app/issues)
