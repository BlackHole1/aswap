# aswap

English | [简体中文](docs/readme/README.zh-CN.md) | [繁體中文](docs/readme/README.zh-TW.md) | [日本語](docs/readme/README.ja.md) | [한국어](docs/readme/README.ko.md) | [Русский](docs/readme/README.ru.md) | [Français](docs/readme/README.fr.md) | [Español](docs/readme/README.es.md)

Account swap for Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) with a maintained set of fixes on top.

`cswap` switches between several Claude accounts, tracks each account's usage windows, and can move you to the account with the most headroom. aswap ships the same tool, built from the unmodified upstream source plus a small, reviewable series of patches for the problems upstream has not fixed yet. You get the `cswap` command you already know, with the rough edges filed off.

## The name

aswap is short for **account swap**, which is what the tool does. Set it next to `cswap` and the `a` is also the one thing this project adds: aswap is cswap plus a patch series, nothing else. And as Claude Code turns into a general agent runtime, the `a` leaves room for the accounts that come with it, AI accounts and agent accounts alike.

## Install

```bash
uv tool install aswap      # or: pipx install aswap
aswap --version
```

`aswap` accepts everything `cswap` does. It installs next to an upstream `cswap` without touching it. To make `cswap` run aswap as well:

```bash
aswap link                 # creates a cswap launcher next to aswap; aswap unlink removes it
```

`aswap link` refuses to overwrite a `cswap` it did not create; uninstall upstream first (`uv tool uninstall claude-swap`) or pass `--force`.

## Upgrading

```bash
aswap upgrade              # uv tool upgrade aswap / pipx upgrade aswap, whichever installed it
```

Building from source, and replacing the PyPI `cswap` in place with the patched build, are covered in [CONTRIBUTING.md](CONTRIBUTING.md).

## What the patches fix

| patch                                                                                                                                                    | problem                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Follow the live credential's owner](patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)                             | Several Claude Code processes share `~/.claude.json`. One started before a `cswap switch` still holds the previous account in memory and writes it back (the Chrome extension's native host did exactly that, 16 seconds after the switch, in the case we measured). The config then names account B while the credential store still holds account A's token. Upstream trusts the label: A is treated as idle, its already-consumed backup refresh token is sent, `invalid_grant` comes back, and A shows a false "re-login needed"; B is served A's foreign token and never refreshes from its own backup. Both accounts stall and the display blames A. The patch attributes the live credential to its real owner, remembers the answer across runs, keeps the other account refreshing from its own backup, and repairs the wrongly condemned backup. |
| [Report, check and upgrade the distribution this install came from](patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch) | Upstream hard-codes the `claude-swap` distribution for its version, its PyPI update check, and `cswap upgrade`. Installed as `aswap`, that would crash on import, nag about claude-swap's version on every run, and upgrade the wrong package. The patch reads the installed metadata and follows whichever distribution provides the code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Every patch is one commit with a message explaining the upstream problem. The full list is in [patches/.patches](patches/.patches).

## How it is built

Upstream is not forked. It is pulled in unchanged as a git submodule at `cswap/`, and every change lives in `patches/` as an ordinary `git am` patch, applied in the order listed in `patches/.patches`. This is [the layout Electron uses for its Node and Chromium patches](https://github.com/electron/electron/tree/main/patches): the delta stays small and readable, and moving to a newer upstream is a rebase of the series rather than a merge. Details, commands, and the patch workflow are in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, like claude-swap. See [LICENSE](LICENSE).
