<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | 繁體中文 | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Claude Code 的帳號切換工具：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) 加上一組持續維護的修正。

</div>

`cswap` 可在多個 Claude 帳號之間切換，追蹤每個帳號的用量，並把你切到餘量最多的帳號。aswap 是同一套工具，基於未改動的上游原始碼，加上一小份補丁，用來修上游還沒處理的問題。你用的還是 `cswap` 指令。

## 名稱

aswap 是 **account swap** (帳號切換) 的縮寫，說的就是這個工具做的事。和 `cswap` 放在一起時，那個 `a` 也是本專案加上去的部分：aswap 就是 cswap 加一組補丁。Claude Code 正在變成通用的 agent 執行環境，這個 `a` 也對應隨之出現的 AI 與 agent 帳號。

## 安裝

```bash
uv tool install aswap  # 或：pipx install aswap
aswap --version
```

`aswap` 接受 `cswap` 的全部用法，可以和上游的 `cswap` 一起安裝，互不影響。若希望用 `cswap` 這個名字執行 aswap：

```bash
aswap link  # 在 aswap 旁邊建立一個 cswap 啟動器；aswap unlink 可移除
```

`aswap link` 只會取代由它自己建立的 `cswap`。請先解除安裝上游 (`uv tool uninstall claude-swap`)，或加上 `--force`。

## 升級

```bash
aswap upgrade  # 依安裝方式執行 uv tool upgrade aswap 或 pipx upgrade aswap
```

從原始碼建置，以及用打過補丁的版本取代已安裝的 PyPI `cswap`，見 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 補丁修正了什麼

`cswap refresh` 立即逐個帳號抓取用量，並給出被限流帳號可重試的時間：

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` 為每個已存帳號開啟一個獨立的 Claude Desktop 視窗，各自保持登入：

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` 在預設 Chrome profile 的一份副本裡開啟帳號 2，那裡的 Claude in Chrome 擴充功能以帳號 2 運作，預設瀏覽器保持原來的登入：

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| 補丁                                                                                                                            | 問題                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [跟隨目前憑證的真正擁有者](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)        | 過期的 `~/.claude.json` 可能仍寫著帳號 B，鑰匙圈裡卻已是帳號 A 的 token。上游會把 A 標成需要重新登入，也不再更新 B。                                                                                                                                                                                                   |
| [跟隨實際安裝的發行版](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)               | 版本號、更新檢查和 `upgrade` 寫死了 `claude-swap`，安裝成 `aswap` 後會失效。                                                                                                                                                                                                                                           |
| [依需求重新整理用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)               | 用量只依上游自己的節奏重新整理，介面一直顯示快取的數字，也不顯示伺服器允許重試的時間。`cswap refresh [帳號 ...]` 會立即逐個帳號抓取。                                                                                                                                                                                  |
| [合併歷史時不丟檔案](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)          | 把 profile 的歷史併入 `~/.claude` 時，同名檔案不看內容就被刪掉，之後的工作階段或 `memory/MEMORY.md` 會遺失。內容不同的檔案留在 `history-conflicts/`。                                                                                                                                                                  |
| [共享同一份對話歷史](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                        | 每次啟動如果不帶 `--share-history`，切換預設帳號後 `claude --resume` 就找不到先前的對話 (上游 #239)。現在預設共享 (`session.shareHistory`)。                                                                                                                                                                           |
| [依帳號開啟 Claude Desktop](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)            | Claude Desktop 每個 profile 只保留一個登入，換帳號就要先登出再登入。`cswap desktop 2` 在獨立視窗開啟帳號 2，其他視窗可以同時開著，做法同 [guise](https://github.com/siddhjagani/guise)。Code 分頁仍能看到同樣的本機工作階段。                                                                                          |
| [依帳號開啟 Chrome (Claude in Chrome)](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | Claude in Chrome 跟著瀏覽器裡的 claude.ai 登入，而不是 `cswap switch` 剛切到的帳號 (上游 #256)。`cswap chrome 2` 用獨立的 Chrome profile 開啟帳號 2。關掉該視窗後，`cswap chrome --sync 2` 會再複製一份你的 profile。`chrome.followSwitch` 會在切換時把視窗帶到前景，`chrome.appPath` 可指向 Edge、Brave 或 Chromium。 |

每個補丁都是一次提交。提交訊息說明上游的問題。完整清單見 [patches/.patches](../../patches/.patches)。

## 建置方式

專案在 `upstream.json` 裡固定一個上游 commit，原樣複製到 `cswap/`，所有變更都以一般的 `git am` 補丁放在 `patches/` 下，按 `patches/.patches` 列出的順序套用。這和 [Electron 管理 Node 與 Chromium 補丁的方式](https://github.com/electron/electron/tree/main/patches) 相同：差異保持小、易讀，升級上游就是對補丁序列做一次 rebase。細節、指令和補丁工作流程見 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 授權

MIT，與 claude-swap 相同。見 [LICENSE](../../LICENSE)。
