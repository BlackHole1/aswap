<div align="center">

# aswap

English | [简体中文](docs/readme/README.zh-CN.md) | [繁體中文](docs/readme/README.zh-TW.md) | [日本語](docs/readme/README.ja.md) | [한국어](docs/readme/README.ko.md) | [Русский](docs/readme/README.ru.md) | [Français](docs/readme/README.fr.md) | [Español](docs/readme/README.es.md)

Account swap for Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) with a maintained set of fixes on top.

</div>

`cswap` switches between several Claude accounts, tracks each account's usage windows, and can move you to the account with the most headroom. aswap ships the same tool, built from the unmodified upstream source plus a small, reviewable series of patches for the problems upstream has not fixed yet. You get the `cswap` command you already know, with the rough edges filed off.

## The name

aswap is short for **account swap**, which is what the tool does. Set it next to `cswap` and the `a` is also the one thing this project adds: aswap is cswap plus a patch series, nothing else. And as Claude Code turns into a general agent runtime, the `a` leaves room for the accounts that come with it, AI accounts and agent accounts alike.

## Install

```bash
uv tool install aswap  # or: pipx install aswap
aswap --version
```

`aswap` accepts everything `cswap` does. It installs next to an upstream `cswap` without touching it. To make `cswap` run aswap as well:

```bash
aswap link  # creates a cswap launcher next to aswap; aswap unlink removes it
```

`aswap link` refuses to overwrite a `cswap` it did not create; uninstall upstream first (`uv tool uninstall claude-swap`) or pass `--force`.

## Upgrading

```bash
aswap upgrade  # uv tool upgrade aswap / pipx upgrade aswap, whichever installed it
```

Building from source, and replacing the PyPI `cswap` in place with the patched build, are covered in [CONTRIBUTING.md](CONTRIBUTING.md).

## What the patches fix

| patch                                                                                                                         | problem                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Follow the live credential's owner](patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)  | A stale `~/.claude.json` can name account B while the keychain holds account A's token. Upstream then flags A as "re-login needed" and never refreshes B. The patch follows the credential's real owner and remembers it across runs.                                                                                                                                                                                                                                                  |
| [Follow the installed distribution](patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)      | Version, update check and `upgrade` hard-code `claude-swap`. Installed as `aswap` they break. The patch follows whichever distribution provides the code.                                                                                                                                                                                                                                                                                                                              |
| [Refresh usage on demand](patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)              | Usage is only fetched on upstream's own schedule; until the serve TTL, poll plan and failure backoff all allow another request, every surface shows the cached number, and the server's retry deadline is never shown. `cswap refresh [account ...]` fetches now, each account independently, and reports when a rate-limited account may retry.                                                                                                                                       |
| [Keep the history merge lossless](patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch) | When `cswap run` merges a profile's own history into `~/.claude`, upstream treats every same-named file as a duplicate and deletes the profile's copy without looking at it. A transcript continued after an un-share, or a project's `memory/MEMORY.md`, is silently lost. The patch drops a copy only when the two are byte-identical and sets a differing one aside under `history-conflicts/`.                                                                                     |
| [Share one conversation history](patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                | Each account keeps its own `projects/` unless every launch carries `--share-history`, and when the account is the default login `cswap run` skips the profile altogether. One account's sessions end up in two places, and `claude --resume` cannot find a conversation after the default changes (upstream #239). The patch makes sharing the default, keeps it in the `session.shareHistory` setting, and folds a profile's history into `~/.claude` even on the default-login path. |

Every patch is one commit with a message explaining the upstream problem. The full list is in [patches/.patches](patches/.patches).

## How it is built

Upstream is not forked. It is pinned to one upstream commit in `upstream.json` and cloned unchanged into `cswap/`, and every change lives in `patches/` as an ordinary `git am` patch, applied in the order listed in `patches/.patches`. This is [the layout Electron uses for its Node and Chromium patches](https://github.com/electron/electron/tree/main/patches): the delta stays small and readable, and moving to a newer upstream is a rebase of the series rather than a merge. Details, commands, and the patch workflow are in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, like claude-swap. See [LICENSE](LICENSE).
