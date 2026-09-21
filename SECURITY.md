# Security Policy

aswap builds and installs [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`), a tool that reads, stores, and rotates Claude Code OAuth credentials (access and refresh tokens) for several accounts. A defect in one of our patches can therefore leak a token, consume the wrong refresh grant, or log an account out. We take security reports seriously.

## Scope

- **In scope:** the patches under `patches/`, the scripts under `scripts/`, and the way this repository builds and installs `cswap`.
- **Upstream:** a problem in unmodified claude-swap belongs to [upstream's security process](https://github.com/realiti4/claude-swap/security). If you are unsure which side a problem is on, report it here and we will route it.

## Supported versions

Security fixes land on the `main` branch. Rebuild and reinstall from `main` to receive them.

## Reporting a vulnerability

Please report vulnerabilities privately. Do not open a public issue or pull request until a fix is available.

1. **GitHub private vulnerability reporting (preferred).** Open <https://github.com/BlackHole1/aswap/security/advisories/new>, or go to the repository's **Security** tab and choose **Report a vulnerability**.
2. **Email.** If private reporting is unavailable to you, write to **bh@bugs.cc** with a subject line starting with `[security]`. Email is not an encrypted channel; keep secrets out of the message.

Include a description of the impact, steps to reproduce or the affected code path, the commit or version, and any known mitigation.

**Never include real tokens.** Redact access tokens, refresh tokens, and account identifiers, and describe how to obtain a disposable test credential instead.

## What to expect

- An acknowledgement within 3 business days.
- An initial assessment within 10 business days.
- Coordinated disclosure: the fix is developed privately, published with a GitHub Security Advisory, and credited to you unless you prefer to stay anonymous. We aim to publish within 90 days of the report.
