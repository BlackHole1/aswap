<div align="center">

# aswap

English | [简体中文](docs/readme/README.zh-CN.md) | [繁體中文](docs/readme/README.zh-TW.md) | [日本語](docs/readme/README.ja.md) | [한국어](docs/readme/README.ko.md) | [Русский](docs/readme/README.ru.md) | [Français](docs/readme/README.fr.md) | [Español](docs/readme/README.es.md)

<img src="docs/images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Account swap for Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) with a maintained set of fixes.

</div>

`cswap` switches among several Claude accounts, tracks each account's usage, and can switch you to the account with the most remaining quota. aswap is the same tool, built from unmodified upstream source plus a small patch series for bugs upstream has not fixed. You still run `cswap`.

## The name

aswap is short for **account swap**, which is what the tool does. Next to `cswap`, the `a` is also what this project adds: aswap is cswap plus a patch series. As Claude Code grows into a general agent runtime, that same `a` also fits the AI and agent accounts that come with it.

## Install

```bash
uv tool install aswap  # or: pipx install aswap
aswap --version
```

`aswap` accepts every `cswap` command. It installs alongside an upstream `cswap` without changing it. To run aswap under the name `cswap` as well:

```bash
aswap link  # creates a cswap launcher next to aswap; aswap unlink removes it
```

`aswap link` only replaces a `cswap` that an aswap install created (this one, a development build, a previous install). For an upstream `cswap`, uninstall upstream first (`uv tool uninstall claude-swap`) or pass `--force`.

## Upgrading

```bash
aswap upgrade  # uv tool upgrade aswap / pipx upgrade aswap, whichever installed it
```

Building from source, and replacing an installed PyPI `cswap` with the patched build, are covered in [CONTRIBUTING.md](CONTRIBUTING.md).

## What the patches fix

`cswap refresh` fetches usage right now, one account at a time, and shows when a rate-limited account may retry:

<img src="docs/images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` opens one Claude Desktop window per stored account, each signed in on its own:

<img src="docs/images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` opens account 2 in its own copy of your Chrome profile, so the Claude in Chrome extension there works as account 2 while the stock browser keeps its own login:

<img src="docs/images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| patch                                                                                                                             | problem                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Follow the live credential's owner](patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)      | A stale `~/.claude.json` can still name account B after the keychain holds A's token. Upstream then marks A as needing re-login and never refreshes B.                                                                                                                                                                                                                                    |
| [Follow the installed distribution](patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)          | Version, update check, and `upgrade` hard-code `claude-swap`, so they break when the install is `aswap`.                                                                                                                                                                                                                                                                                  |
| [Refresh usage on demand](patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                  | Upstream refreshes usage only on its own schedule, so screens keep a cached number and hide the server's retry time. `cswap refresh [account ...]` fetches now, one account at a time.                                                                                                                                                                                                    |
| [Keep history files when merging](patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)     | Merging a profile's history into `~/.claude` deletes every same-named file unread, so a later session or `memory/MEMORY.md` can vanish. A different file is kept under `history-conflicts/`.                                                                                                                                                                                              |
| [Share one conversation history](patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                    | Without `--share-history` on every launch, `claude --resume` cannot find the conversation after the default account changes (upstream #239). Sharing is now the default (`session.shareHistory`).                                                                                                                                                                                         |
| [Open Claude Desktop per account](patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)              | Claude Desktop keeps one login per profile, so a second account means signing out and back in. `cswap desktop 2` opens account 2 in its own window, the way [guise](https://github.com/siddhjagani/guise) does, and leaves the others open. The Code tab still lists the same local sessions.                                                                                             |
| [Open Chrome per account for Claude in Chrome](patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | Claude in Chrome follows the browser's claude.ai cookie, not the account selected by `cswap switch` (upstream #256). `cswap chrome 2` opens account 2 in its own Chrome profile. Once that window is closed, `cswap chrome --sync 2` copies your profile in again. `chrome.followSwitch` brings the window forward on switch, and `chrome.appPath` can point at Edge, Brave, or Chromium. |

Each patch is a single commit. The commit message explains the upstream problem. The full list is in [patches/.patches](patches/.patches).

## How it is built

The project pins one upstream commit in `upstream.json`, clones it unchanged into `cswap/`, and keeps every change in `patches/` as an ordinary `git am` patch. Patches apply in the order listed in `patches/.patches`. This matches [the layout Electron uses for its Node and Chromium patches](https://github.com/electron/electron/tree/main/patches): diffs stay small and readable, and moving to a newer upstream is a rebase of the series. Details, commands, and the patch workflow are in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, like claude-swap. See [LICENSE](LICENSE).
