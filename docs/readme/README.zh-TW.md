<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | 繁體中文 | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

Claude Code 的帳號切換工具：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) 加上一組持續維護的修正。

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

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

| 補丁                                                                                                                            | 問題                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [跟隨目前憑證的真正擁有者](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)        | `~/.claude.json` 過期後可能仍寫著帳號 B，而鑰匙圈裡已是帳號 A 的 token。上游會把 A 標成需要重新登入，也不再更新 B。補丁依憑證的真正擁有者判斷，並在多次執行之間記住這個結果。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [跟隨實際安裝的發行版](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)               | 版本號、更新檢查和 `upgrade` 都寫死了 `claude-swap`，安裝成 `aswap` 後會失效。補丁改為跟隨真正提供程式碼的發行版。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [依需求重新整理用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)               | 上游只依自己的節奏抓取用量。在 serve TTL、輪詢計畫和失敗後的等待都允許下一次請求之前，所有介面只顯示快取值，也不提示伺服器允許重試的時間。`cswap refresh [帳號 ...]` 立即抓取，各帳號互不影響，並告知被限流的帳號何時可以重試。                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [合併歷史時不丟檔案](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)          | `cswap run` 把 profile 自己的歷史併入 `~/.claude` 時，上游把所有同名檔案都當成重複項，不看內容就刪掉 profile 那一份。關閉共享後繼續過的工作階段，或專案裡的 `memory/MEMORY.md`，會悄悄遺失。補丁只在兩份完全相同時才丟棄，內容不同的那份放到 `history-conflicts/` 下保留。                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [共享同一份對話歷史](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                        | 除非每次啟動都帶 `--share-history`，每個帳號各有一份 `projects/`。當該帳號是預設登入時，`cswap run` 會完全跳過 profile。同一帳號的工作階段會散落在兩處，切換預設帳號後 `claude --resume` 就找不到先前的對話 (上游 #239)。補丁把共享設為預設，記在 `session.shareHistory` 設定裡，並在預設登入路徑上也把 profile 的歷史併入 `~/.claude`。                                                                                                                                                                                                                                                                                                                                                                     |
| [依帳號開啟 Claude Desktop](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)            | Claude Desktop 每個 profile 只保留一個登入，想用第二個帳號就得先登出再重新登入，每次皆然。修補給每個已存帳號一個永久的桌面 profile，並以 `--user-data-dir` 啟動應用程式，做法同 [guise](https://github.com/siddhjagani/guise)：`cswap desktop 2` 在獨立視窗開啟帳號 2，登入一次後持續保持登入，其他帳號的視窗可同時開著。Code 分頁的本機工作階段與預設 profile 共享，這樣開啟的視窗能看到同樣的工作階段。                                                                                                                                                                                                                                                                                                    |
| [依帳號開啟 Chrome (Claude in Chrome)](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | `cswap switch` 切換的是 Claude Code，而 Claude in Chrome 擴充功能仍以瀏覽器裡登入 claude.ai 的那個帳號運作，那是一枚與 cswap 所存憑證不同的 cookie (上游 #256)。要替換這枚 cookie 就得解密 Chrome 的儲存並改寫另一個擴充功能的狀態。修補給每個已存帳號一個永久的 Chrome profile，並以 `--user-data-dir` 啟動瀏覽器：`cswap chrome 2` 在獨立瀏覽器裡開啟帳號 2：它是預設 Chrome profile 去掉 claude.ai cookie 後的副本，其他網站保持登入、擴充功能原樣帶過來，在裡面登入一次 Claude 後持續保持。每個 profile 以帳號命名並有自己的視窗顏色；帳號已開啟時則把它的瀏覽器帶到前景；`cswap chrome --sync 2` 可隨時從預設 profile 重新同步，保留該帳號的登入。`chrome.appPath` 可改為指向 Edge、Brave 或 Chromium。 |

每個補丁都是一次提交。提交訊息說明上游的問題。完整清單見 [patches/.patches](../../patches/.patches)。

`cswap refresh` 立即逐個帳號抓取用量，並給出被限流帳號可重試的時間：

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` 為每個已存帳號開啟一個獨立的 Claude Desktop 視窗，各自保持登入：

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

## 建置方式

專案在 `upstream.json` 裡固定一個上游 commit，原樣複製到 `cswap/`，所有變更都以一般的 `git am` 補丁放在 `patches/` 下，按 `patches/.patches` 列出的順序套用。這和 [Electron 管理 Node 與 Chromium 補丁的方式](https://github.com/electron/electron/tree/main/patches) 相同：差異保持小、易讀，升級上游就是對補丁序列做一次 rebase。細節、指令和補丁工作流程見 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 授權

MIT，與 claude-swap 相同。見 [LICENSE](../../LICENSE)。
