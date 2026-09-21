<div align="center">

# aswap

[English](../../README.md) | 简体中文 | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

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

| 补丁                                                                                                                     | 问题                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [跟随当前凭据的真正所有者](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | `~/.claude.json` 过期后可能仍写着账户 B，而钥匙串里已是账户 A 的 token。上游会把 A 标成需要重新登录，也不再刷新 B。补丁按凭据的真正所有者判断，并在多次运行之间记住这个结果。                                                                                                                                                                                                                       |
| [跟随实际安装的发行版](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)        | 版本号、更新检查和 `upgrade` 都写死了 `claude-swap`，安装成 `aswap` 后会失效。补丁改为跟随真正提供代码的发行版。                                                                                                                                                                                                                                                                                    |
| [按需刷新用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)              | 上游只按自己的节奏抓取用量。在 serve TTL、轮询计划和失败后的等待都允许下一次请求之前，所有界面只显示缓存值，也不提示服务端允许重试的时间。`cswap refresh [账户 ...]` 立即抓取，各账户互不影响，并告知被限流的账户何时可以重试。                                                                                                                                                                     |
| [合并历史时不丢文件](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)   | `cswap run` 把 profile 自己的历史并入 `~/.claude` 时，上游把所有同名文件都当成重复项，不看内容就删掉 profile 那一份。关闭共享后继续过的会话，或项目里的 `memory/MEMORY.md`，会悄悄丢失。补丁只在两份完全相同时才丢弃，内容不同的那份放到 `history-conflicts/` 下保留。                                                                                                                              |
| [共享同一份会话历史](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                 | 除非每次启动都带 `--share-history`，每个账户各有一份 `projects/`。当该账户是默认登录时，`cswap run` 会完全跳过 profile。同一账户的会话会散落在两处，切换默认账户后 `claude --resume` 就找不到之前的对话 (上游 #239)。补丁把共享设为默认，记在 `session.shareHistory` 设置里，并在默认登录路径上也把 profile 的历史并入 `~/.claude`。                                                                |
| [按账户打开 Claude Desktop](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)     | Claude Desktop 每个 profile 只保留一个登录，想用第二个账户就得先登出再重新登录，每次如此。补丁给每个已存账户一个永久的桌面 profile，并用 `--user-data-dir` 启动应用，做法同 [guise](https://github.com/siddhjagani/guise)：`cswap desktop 2` 在独立窗口里打开账户 2，登录一次后一直保持登录，其他账户的窗口可以同时开着。Code 标签页的本地会话与默认 profile 共享，这样打开的窗口能看到同样的会话。 |

每个补丁都是一次提交。提交信息说明上游的问题。完整列表见 [patches/.patches](../../patches/.patches)。

## 构建方式

项目在 `upstream.json` 里固定一个上游 commit，原样克隆到 `cswap/`，所有改动都以普通的 `git am` 补丁放在 `patches/` 下，按 `patches/.patches` 列出的顺序应用。这和 [Electron 管理 Node 与 Chromium 补丁的方式](https://github.com/electron/electron/tree/main/patches) 相同：差异保持小、易读，升级上游就是对补丁序列做一次 rebase。细节、命令和补丁工作流见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 许可证

MIT，与 claude-swap 相同。见 [LICENSE](../../LICENSE)。
