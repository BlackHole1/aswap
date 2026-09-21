<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | 繁體中文 | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

Claude Code 的帳號切換工具：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) 加上一組持續維護的修正。

</div>

`cswap` 可以在多個 Claude 帳號之間切換，追蹤每個帳號的用量視窗，並把你切到餘量最多的帳號。aswap 提供的是同一個工具：由未經修改的上游原始碼建置，再疊加一小組可審閱的補丁，修掉上游尚未處理的問題。你得到的還是熟悉的 `cswap` 指令，只是毛邊被磨平了。

## 名字的由來

aswap 是 **account swap** (帳號切換) 的縮寫，這正是這個工具做的事。把它和 `cswap` 放在一起看，那個 `a` 也是這個專案唯一添加的東西：aswap 就是 cswap 加一組補丁，別無其他。隨著 Claude Code 逐漸成為通用的 agent 執行環境，這個 `a` 也給隨之而來的帳號留了位置：AI 帳號、agent 帳號，都算。

## 安裝

```bash
uv tool install aswap  # 或：pipx install aswap
aswap --version
```

`aswap` 接受 `cswap` 的全部用法，並與上游的 `cswap` 並存、互不干擾。想讓 `cswap` 這個名字也執行 aswap：

```bash
aswap link  # 在 aswap 旁邊建立一個 cswap 啟動器；aswap unlink 可移除
```

`aswap link` 不會覆蓋不是它建立的 `cswap`；先移除上游 (`uv tool uninstall claude-swap`)，或加 `--force`。

## 升級

```bash
aswap upgrade  # 依安裝方式執行 uv tool upgrade aswap 或 pipx upgrade aswap
```

從原始碼建置，以及用打過補丁的版本原位取代 PyPI 的 `cswap`，見 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 補丁修正了什麼

| 補丁                                                                                                                     | 問題                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [跟隨活動憑證的真正擁有者](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | `~/.claude.json` 過期後可能寫著帳號 B，而鑰匙圈裡是帳號 A 的 token。上游據此誤報 A 需要重新登入，B 也不再重新整理。補丁依憑證的真正擁有者判斷，並跨執行記住結果。 |
| [跟隨實際安裝的發行版](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)        | 版本號、更新檢查和 `upgrade` 寫死了 `claude-swap`，裝成 `aswap` 後全部失效。補丁改為跟隨真正提供程式碼的發行版。                                                  |
| [依需求重新整理用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)        | 用量介面回傳 429 後，`ls` 會顯示一小時前的舊資料且無法重新取得。`cswap refresh [帳號 ...]` 立即重新整理，各帳號互不影響，被限流時告知伺服器允許重試的時間。       |

每個補丁都是一次提交，提交訊息說明上游的問題。完整清單見 [patches/.patches](../../patches/.patches)。

## 建置方式

上游不做 fork。它由 `upstream.json` 固定到一個上游 commit，原樣複製到 `cswap/`，所有變更都以一般的 `git am` 補丁存放在 `patches/` 下，依 `patches/.patches` 列出的順序依序套用。這正是 [Electron 管理 Node 與 Chromium 補丁的方式](https://github.com/electron/electron/tree/main/patches)：差異保持小而易讀，升級上游只是對補丁序列做一次 rebase，而不是 merge。細節、指令和補丁工作流程見 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 授權

MIT，與 claude-swap 相同。見 [LICENSE](../../LICENSE)。
