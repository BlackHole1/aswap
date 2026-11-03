<div align="center">

# aswap

[English](../../README.md) | 简体中文 | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

基于 [claude-swap](https://github.com/realiti4/claude-swap) 的 Claude Code 多账户切换工具，附带一组持续维护的修复和新功能。

</div>

`cswap` 用来管理多个 Claude 账户。它会记录每个账户的用量，并能切换到剩余额度最多的账户。aswap 使用未经修改的上游源码构建 `cswap`，再在其上应用一小组补丁。所有 `cswap` 命令保持原样可用。

名字取自 **account swap**。

## 安装

```bash
uv tool install aswap  # 或：pipx install aswap
aswap --version
```

`aswap` 支持所有 `cswap` 命令。它可以和上游 `cswap` 同时安装，不会改动后者。

如果也想用 `cswap` 这个名字运行 aswap：

```bash
aswap link    # 在 aswap 旁边创建 cswap 启动器
aswap unlink  # 移除该启动器
```

`aswap link` 只会替换由 aswap 安装创建的 `cswap` 启动器。如需替换上游 `cswap`，请先卸载上游 (`uv tool uninstall claude-swap`)，或加上 `--force`。

升级时运行 `aswap upgrade`。它会根据安装方式调用 `uv tool upgrade` 或 `pipx upgrade`。

## aswap 新增了什么

### 按需刷新用量

`cswap refresh [account ...]` 会立即逐个账户拉取用量。对于被限流的账户，会显示服务端允许下次重试的时间。

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### 每个账户一个 Claude Desktop 窗口

Claude Desktop 同一时间只能登录一个账户。`cswap desktop 2` 会在独立窗口中打开账户 2，并保持其各自的登录状态；`cswap desktop --all` 会打开所有账户。每个窗口的 Code 标签页都显示相同的本地会话 (Windows 除外)。实现思路参考了 [guise](https://github.com/siddhjagani/guise)。

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### 每个账户一个 Chrome profile

Claude in Chrome 使用浏览器里登录的 claude.ai 账户，而不是 `cswap switch` 选中的账户 ([上游 #256](https://github.com/realiti4/claude-swap/issues/256))。`cswap chrome 2` 会用你的 Chrome profile 的一份独立副本打开账户 2。其中的扩展以账户 2 运行，主浏览器的登录不受影响。

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2` 会把当前的 Chrome profile 重新复制到账户 2。执行前请先关闭该账户的窗口。
- `cswap config set chrome.followSwitch true` 会在 `cswap switch` 时把对应账户的浏览器窗口带到前台。
- `cswap config set chrome.appPath <path>` 可以改用其他 Chromium 内核浏览器，例如 Edge 或 Brave。

### 共享会话历史

`cswap run` 默认让所有账户共享同一份会话历史。切换账户后，`claude --resume` 仍能找到之前的对话 ([上游 #239](https://github.com/realiti4/claude-swap/issues/239))。如需按账户分开保存，运行 `cswap config set run.shareHistory false`。暂不支持 Windows。

### 问题修复

- **账户配置过期。** 如果 `~/.claude.json` 仍指向账户 B，而钥匙串中已是账户 A 的 token，上游会要求重新登录 A，并停止刷新 B。aswap 会以实际持有当前 token 的账户为准。
- **历史文件丢失。** 上游把 profile 的历史合并到 `~/.claude` 时，会不加比较地删除同名文件，可能导致会话或 `memory/MEMORY.md` 丢失。aswap 会把内容不同的文件另存到 `history-conflicts/`。
- **版本与升级。** `--version`、更新检查和 `upgrade` 都写死了 `claude-swap` 包名。aswap 会使用实际安装的包。

## 构建方式

`upstream.json` 固定了一个上游 commit。`bun run setup` 会把该 commit 原样克隆到 `cswap/`，再按 [patches/.patches](../../patches/.patches) 中的顺序，用 `git am` 应用 `patches/` 下的所有补丁。这套结构参考了 [Electron 管理 Chromium 和 Node 补丁的方式](https://github.com/electron/electron/tree/main/patches)。每个 diff 都保持小而易读，升级上游只需对补丁序列做一次 rebase。

| 补丁                                                                                                                       | 变更                  |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| [以当前凭据的实际所有者为准](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | 修复：账户配置过期    |
| [以实际安装的发行包为准](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)        | 修复：版本与升级      |
| [按需刷新用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                | 功能：`cswap refresh` |
| [合并历史时保留文件](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)     | 修复：历史文件丢失    |
| [共享同一份会话历史](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                   | 功能：共享会话历史    |
| [按账户打开 Claude Desktop](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)       | 功能：`cswap desktop` |
| [按账户打开 Chrome](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)               | 功能：`cswap chrome`  |

每个补丁对应一个 commit，提交信息中说明了对应的上游问题。如需从源码构建或修改补丁，请参阅 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 许可证

MIT，与 claude-swap 相同。详见 [LICENSE](../../LICENSE)。
