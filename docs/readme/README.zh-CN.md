<div align="center">

# aswap

[English](../../README.md) | 简体中文 | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Claude Code 的账户切换工具：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) 加上一组持续维护的修复。

</div>

`cswap` 可在多个 Claude 账户之间切换，跟踪每个账户的用量，并把你切到余量最多的账户。aswap 是同一套工具，基于未改动的上游源码，加上一小份补丁，用来修上游还没处理的问题。你用的还是 `cswap` 命令。

## 名字

aswap 是 **account swap** (账户切换) 的缩写，说的就是这个工具做的事。和 `cswap` 放在一起时，那个 `a` 也是本项目加上去的部分：aswap 就是 cswap 加一组补丁。Claude Code 正在变成通用的 agent 运行环境，这个 `a` 也对应随之出现的 AI 与 agent 账户。

## 安装

```bash
uv tool install aswap  # 或：pipx install aswap
aswap --version
```

`aswap` 接受 `cswap` 的全部用法，可以和上游的 `cswap` 一起安装，互不影响。若希望用 `cswap` 这个名字运行 aswap：

```bash
aswap link  # 在 aswap 旁边创建一个 cswap 启动器；aswap unlink 可移除
```

`aswap link` 只会替换由它自己创建的 `cswap`。请先卸载上游 (`uv tool uninstall claude-swap`)，或加上 `--force`。

## 升级

```bash
aswap upgrade  # 按安装方式执行 uv tool upgrade aswap 或 pipx upgrade aswap
```

从源码构建，以及用打过补丁的版本替换已安装的 PyPI `cswap`，见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 补丁修复了什么

`cswap refresh` 立即逐个账户拉取用量，并给出被限流账户可重试的时间：

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` 为每个已存账户打开一个独立的 Claude Desktop 窗口，各自保持登录：

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` 在默认 Chrome profile 的一份副本里打开账户 2，那里的 Claude in Chrome 扩展以账户 2 工作，默认浏览器保持原来的登录：

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| 补丁                                                                                                                            | 问题                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [跟随当前凭据的真正所有者](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)        | 过期的 `~/.claude.json` 可能仍写着账户 B，钥匙串里却已是账户 A 的 token。上游会把 A 标成需要重新登录，也不再刷新 B。                                                                                                                                                                                                   |
| [跟随实际安装的发行版](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)               | 版本号、更新检查和 `upgrade` 写死了 `claude-swap`，安装成 `aswap` 后会失效。                                                                                                                                                                                                                                           |
| [按需刷新用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                     | 用量只按上游自己的节奏刷新，界面一直显示缓存的数字，也不显示服务端允许重试的时间。`cswap refresh [账户 ...]` 会立即逐个账户抓取。                                                                                                                                                                                      |
| [合并历史时不丢文件](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)          | 把 profile 的历史并入 `~/.claude` 时，同名文件不看内容就被删掉，之后的会话或 `memory/MEMORY.md` 会丢失。内容不同的文件留在 `history-conflicts/`。                                                                                                                                                                      |
| [共享同一份会话历史](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                        | 每次启动如果不带 `--share-history`，切换默认账户后 `claude --resume` 就找不到之前的对话 (上游 #239)。现在默认共享 (`session.shareHistory`)。                                                                                                                                                                           |
| [按账户打开 Claude Desktop](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)            | Claude Desktop 每个 profile 只保留一个登录，换账户就要先登出再登录。`cswap desktop 2` 在独立窗口打开账户 2，其他窗口可以同时开着，做法同 [guise](https://github.com/siddhjagani/guise)。Code 标签页仍能看到同样的本地会话。                                                                                            |
| [按账户打开 Chrome (Claude in Chrome)](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | Claude in Chrome 跟着浏览器里的 claude.ai 登录，而不是 `cswap switch` 刚切到的账户 (上游 #256)。`cswap chrome 2` 用独立的 Chrome profile 打开账户 2。关掉该窗口后，`cswap chrome --sync 2` 会再复制一份你的 profile。`chrome.followSwitch` 会在切换时把窗口带到前台，`chrome.appPath` 可指向 Edge、Brave 或 Chromium。 |

每个补丁都是一次提交。提交信息说明上游的问题。完整列表见 [patches/.patches](../../patches/.patches)。

## 构建方式

项目在 `upstream.json` 里固定一个上游 commit，原样克隆到 `cswap/`，所有改动都以普通的 `git am` 补丁放在 `patches/` 下，按 `patches/.patches` 列出的顺序应用。这和 [Electron 管理 Node 与 Chromium 补丁的方式](https://github.com/electron/electron/tree/main/patches) 相同：差异保持小、易读，升级上游就是对补丁序列做一次 rebase。细节、命令和补丁工作流见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 许可证

MIT，与 claude-swap 相同。见 [LICENSE](../../LICENSE)。
