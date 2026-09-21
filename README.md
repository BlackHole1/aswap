<div align="center">

# aswap

English | [简体中文](docs/readme/README.zh-CN.md) | [繁體中文](docs/readme/README.zh-TW.md) | [日本語](docs/readme/README.ja.md) | [한국어](docs/readme/README.ko.md) | [Русский](docs/readme/README.ru.md) | [Français](docs/readme/README.fr.md) | [Español](docs/readme/README.es.md)

Account swap for Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) with a maintained set of fixes.

<img src="docs/images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

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

| patch                                                                                                                             | problem                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Follow the live credential's owner](patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)      | A stale `~/.claude.json` can still name account B after the keychain already holds account A's token. Upstream then marks A as "re-login needed" and never refreshes B. The patch follows the credential's real owner and remembers it across runs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [Follow the installed distribution](patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)          | Version, update check, and `upgrade` hard-code the name `claude-swap`, so they break when the install is `aswap`. The patch follows the distribution that actually provides the code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [Refresh usage on demand](patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                  | Upstream fetches usage only on its own schedule. Until the serve TTL, poll plan, and failure backoff all allow another request, every screen shows the cached number, and the server's retry time is never shown. `cswap refresh [account ...]` fetches immediately, each account on its own, and reports when a rate-limited account may retry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [Keep history files when merging](patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)     | When `cswap run` merges a profile's own history into `~/.claude`, upstream treats every same-named file as a duplicate and deletes the profile's copy without reading it. A session continued after sharing was turned off, or a project's `memory/MEMORY.md`, is lost with no warning. The patch drops a copy only when the two files are identical, and keeps a differing copy under `history-conflicts/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [Share one conversation history](patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                    | Each account keeps its own `projects/` unless every launch passes `--share-history`. When that account is the default login, `cswap run` skips the profile entirely. One account's sessions end up in two places, and `claude --resume` cannot find a conversation after the default account changes (upstream #239). The patch makes sharing the default, stores it in the `session.shareHistory` setting, and merges the profile's history into `~/.claude` on the default-login path as well.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [Open Claude Desktop per account](patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)              | Claude Desktop holds one login per profile, so a second account means signing the first one out and back in every time. The patch gives every stored account its own permanent desktop profile and opens the app against it with `--user-data-dir`, the way [guise](https://github.com/siddhjagani/guise) does: `cswap desktop 2` opens account 2 in its own window, signed in once and staying signed in, while the other accounts' windows stay open beside it. The Code tab's local sessions are shared with the stock profile, so a window opened this way lists the same sessions.                                                                                                                                                                                                                                                                                                                             |
| [Open Chrome per account for Claude in Chrome](patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | `cswap switch` moves Claude Code to another account, but the Claude in Chrome extension keeps acting as whoever is signed in to claude.ai in the browser, a cookie that is a different credential from the one cswap stores (upstream #256). Swapping that cookie would mean decrypting Chrome's storage and rewriting another extension's state. The patch gives every stored account its own permanent Chrome profile and opens the browser against it with `--user-data-dir`: `cswap chrome 2` opens account 2 in its own browser: a copy of your stock Chrome profile minus its claude.ai cookies, so other sites stay signed in and your extensions come along; sign in to Claude there once and it stays that way. Each profile is named after its account with its own window colour, and an account that is already open is brought forward. `chrome.appPath` points it at Edge, Brave or Chromium instead. |

Each patch is a single commit. The commit message explains the upstream problem. The full list is in [patches/.patches](patches/.patches).

`cswap refresh` fetches usage right now, one account at a time, and shows when a rate-limited account may retry:

<img src="docs/images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` opens one Claude Desktop window per stored account, each signed in on its own:

<img src="docs/images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

## How it is built

The project pins one upstream commit in `upstream.json`, clones it unchanged into `cswap/`, and keeps every change in `patches/` as an ordinary `git am` patch. Patches apply in the order listed in `patches/.patches`. This matches [the layout Electron uses for its Node and Chromium patches](https://github.com/electron/electron/tree/main/patches): diffs stay small and readable, and moving to a newer upstream is a rebase of the series. Details, commands, and the patch workflow are in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, like claude-swap. See [LICENSE](LICENSE).
