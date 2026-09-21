<div align="center">

# aswap

[English](../../README.md) | 简体中文 | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

Claude Code 的账户切换工具：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) 加上一组持续维护的修复。

</div>

`cswap` 可以在多个 Claude 账户之间切换，跟踪每个账户的用量窗口，并把你切到余量最多的账户。aswap 提供的是同一个工具：由未经修改的上游源码构建，再叠加一小组可审阅的补丁，修掉上游尚未处理的问题。你得到的还是熟悉的 `cswap` 命令，只是毛刺被磨平了。

## 名字的由来

aswap 是 **account swap** (账户切换) 的缩写，这正是这个工具做的事。把它和 `cswap` 放在一起看，那个 `a` 也是这个项目唯一添加的东西：aswap 就是 cswap 加一组补丁，别无其他。随着 Claude Code 逐渐成为通用的 agent 运行时，这个 `a` 也给随之而来的账户留了位置：AI 账户，agent 账户，都算。

## 安装

```bash
uv tool install aswap  # 或：pipx install aswap
aswap --version
```

`aswap` 接受 `cswap` 的全部用法，并与上游的 `cswap` 并存、互不干扰。想让 `cswap` 这个名字也运行 aswap：

```bash
aswap link  # 在 aswap 旁边创建一个 cswap 启动器；aswap unlink 可移除
```

`aswap link` 不会覆盖不是它创建的 `cswap`；先卸载上游 (`uv tool uninstall claude-swap`)，或加 `--force`。

## 升级

```bash
aswap upgrade  # 按安装方式执行 uv tool upgrade aswap 或 pipx upgrade aswap
```

从源码构建，以及用打过补丁的版本原位替换 PyPI 的 `cswap`，见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 补丁修复了什么

| 补丁                                                                                                                     | 问题                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [跟随活动凭据的真正所有者](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | `~/.claude.json` 过期后可能写着账户 B，而钥匙串里是账户 A 的 token。上游据此误报 A 需要重新登录，B 也不再刷新。补丁按凭据的真正所有者判断，并跨运行记住结果。                                                                                                                                                                          |
| [跟随实际安装的发行版](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)        | 版本号、更新检查和 `upgrade` 写死了 `claude-swap`，装成 `aswap` 后全部失效。补丁改为跟随真正提供代码的发行版。                                                                                                                                                                                                                         |
| [按需刷新用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)              | 上游只按自己的节奏抓取用量：在 serve TTL、轮询计划和失败退避全部放行之前，所有界面都只显示缓存值，也从不显示服务端允许重试的时间。`cswap refresh [账号 ...]` 立即抓取，各账号互相独立，并告知被限流账号何时可以重试。                                                                                                                  |
| [合并历史时不丢文件](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)   | `cswap run` 把 profile 自己的历史并入 `~/.claude` 时，上游把所有同名文件都当作重复项，不比对内容就删掉 profile 那份。取消共享后继续过的会话，或项目的 `memory/MEMORY.md`，会无声丢失。补丁只在两份完全相同时才丢弃，内容不同的那份放到 `history-conflicts/` 下保留。                                                                   |
| [共享同一份会话历史](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                 | 除非每次启动都带 `--share-history`，每个账户各有一份 `projects/`；而当该账户正是默认登录时，`cswap run` 会完全跳过 profile。同一账户的会话散落在两处，切换默认账户后 `claude --resume` 就找不到之前的对话 (上游 #239)。补丁把共享设为默认，记在 `session.shareHistory` 设置里，并在默认登录路径上也把 profile 的历史并入 `~/.claude`。 |

每个补丁都是一次提交，提交信息说明上游的问题。完整列表见 [patches/.patches](../../patches/.patches)。

## 构建方式

上游不做 fork。它由 `upstream.json` 固定到一个上游 commit，原样克隆到 `cswap/`，所有改动都以普通的 `git am` 补丁存放在 `patches/` 下，按 `patches/.patches` 列出的顺序依次应用。这正是 [Electron 管理 Node 和 Chromium 补丁的方式](https://github.com/electron/electron/tree/main/patches)：差异保持小而易读，升级上游只是对补丁序列做一次 rebase，而不是 merge。细节、命令和补丁工作流见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 许可证

MIT，与 claude-swap 相同。见 [LICENSE](../../LICENSE)。
