<div align="center">

# aswap

English | [简体中文](docs/readme/README.zh-CN.md) | [繁體中文](docs/readme/README.zh-TW.md) | [日本語](docs/readme/README.ja.md) | [한국어](docs/readme/README.ko.md) | [Русский](docs/readme/README.ru.md) | [Français](docs/readme/README.fr.md) | [Español](docs/readme/README.es.md)

<img src="docs/images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Switch between Claude Code accounts with [claude-swap](https://github.com/realiti4/claude-swap), plus a maintained set of fixes and features.

</div>

`cswap` manages several Claude accounts. It tracks each account's usage and can switch to the one with the most quota left. aswap builds `cswap` from unmodified upstream source and applies a small set of patches on top. All `cswap` commands work as before.

The name stands for **account swap**.

## Install

```bash
uv tool install aswap  # or: pipx install aswap
aswap --version
```

`aswap` accepts every `cswap` command. It installs next to an upstream `cswap` without touching it.

To run aswap as `cswap` too:

```bash
aswap link    # add a cswap launcher next to aswap
aswap unlink  # remove it
```

`aswap link` only replaces a `cswap` launcher created by an aswap install. To replace upstream `cswap`, uninstall it first (`uv tool uninstall claude-swap`), or pass `--force`.

To upgrade, run `aswap upgrade`. It calls `uv tool upgrade` or `pipx upgrade`, depending on how aswap was installed.

## What aswap adds

### Refresh usage on demand

`cswap refresh [account ...]` fetches usage right away, one account at a time. For a rate-limited account, it shows when the server allows the next retry.

<img src="docs/images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### One Claude Desktop window per account

Claude Desktop holds one login at a time. `cswap desktop 2` opens account 2 in its own window with its own login, and `cswap desktop --all` opens every account. The Code tab in each window shows the same local sessions (not on Windows). The approach follows [guise](https://github.com/siddhjagani/guise).

<img src="docs/images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### One Chrome profile per account

Claude in Chrome uses the browser's claude.ai login, not the account picked by `cswap switch` ([upstream #256](https://github.com/realiti4/claude-swap/issues/256)). `cswap chrome 2` opens account 2 in a separate copy of your Chrome profile. The extension there runs as account 2, and your main browser keeps its own login.

<img src="docs/images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2` copies your current Chrome profile into account 2 again. Close its window first.
- `cswap config set chrome.followSwitch true` brings the account's browser forward on `cswap switch`.
- `cswap config set chrome.appPath <path>` uses another Chromium browser, such as Edge or Brave.

### Shared conversation history

`cswap run` shares one conversation history across all accounts by default. `claude --resume` finds earlier conversations after you switch accounts ([upstream #239](https://github.com/realiti4/claude-swap/issues/239)). To keep history per account, run `cswap config set run.shareHistory false`. Not supported on Windows.

### Bug fixes

- **Stale account config.** If `~/.claude.json` still names account B while the keychain holds account A's token, upstream asks to log in to A again and stops refreshing B. aswap follows the account that owns the live token.
- **Lost history files.** When upstream merges a profile's history into `~/.claude`, it deletes same-named files without comparing them. This can lose a session or `memory/MEMORY.md`. aswap sets differing files aside under `history-conflicts/`.
- **Version and upgrade.** `--version`, the update check, and `upgrade` are hard-coded to the `claude-swap` package. aswap uses the package it was installed from.

## How it is built

`upstream.json` pins one upstream commit. `bun run setup` clones that commit unchanged into `cswap/`. It then applies every patch in `patches/` with `git am`, in the order listed in [patches/.patches](patches/.patches). This follows [the layout Electron uses for its Chromium and Node patches](https://github.com/electron/electron/tree/main/patches). Each diff stays small and readable, and moving to a newer upstream is a rebase of the series.

| Patch                                                                                                                         | Change                               |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [Follow the live credential's owner](patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)  | Fix: stale account config            |
| [Follow the installed distribution](patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)      | Fix: version and upgrade             |
| [Refresh usage on demand](patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)              | Feature: `cswap refresh`             |
| [Keep history files when merging](patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch) | Fix: lost history files              |
| [Share one conversation history](patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                | Feature: shared conversation history |
| [Open Claude Desktop per account](patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)          | Feature: `cswap desktop`             |
| [Open Chrome per account](patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)                  | Feature: `cswap chrome`              |

Each patch is a single commit, and its message explains the upstream problem. To build from source or work on patches, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, same as claude-swap. See [LICENSE](LICENSE).
