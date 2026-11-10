<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | 繁體中文 | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

基於 [claude-swap](https://github.com/realiti4/claude-swap) 的 Claude Code 多帳號切換工具，附帶一組持續維護的修正與新功能。

</div>

`cswap` 用來管理多個 Claude 帳號。它會記錄每個帳號的用量，並能切換到剩餘額度最多的帳號。aswap 使用未經修改的上游原始碼建置 `cswap`，再於其上套用一小組修補。所有 `cswap` 指令維持原樣可用。

名稱取自 **account swap**。

## 安裝

```bash
uv tool install aswap  # 或：pipx install aswap
aswap --version
```

`aswap` 支援所有 `cswap` 指令。它可以與上游 `cswap` 同時安裝，不會更動後者。

若也想用 `cswap` 這個名稱執行 aswap：

```bash
aswap link    # 在 aswap 旁建立 cswap 啟動器
aswap unlink  # 移除該啟動器
```

`aswap link` 只會取代由 aswap 安裝建立的 `cswap` 啟動器。若要取代上游 `cswap`，請先解除安裝上游 (`uv tool uninstall claude-swap`)，或加上 `--force`。

升級時執行 `aswap upgrade`。它會依安裝方式呼叫 `uv tool upgrade` 或 `pipx upgrade`。

## aswap 新增了什麼

### 隨時重新整理用量

`cswap refresh [account ...]` 會立即逐一抓取各帳號的用量。對於被限流的帳號，會顯示伺服器允許下次重試的時間。

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### 每個帳號一個 Claude Desktop 視窗

Claude Desktop 同一時間只能登入一個帳號。`cswap desktop 2` 會在獨立視窗中開啟帳號 2，並保留各自的登入狀態；`cswap desktop --all` 會開啟所有帳號。每個視窗的 Code 分頁都顯示相同的本機工作階段 (Windows 除外)。實作思路參考了 [guise](https://github.com/siddhjagani/guise)。

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### 每個帳號一個 Chrome 設定檔

Claude in Chrome 使用瀏覽器中登入的 claude.ai 帳號，而不是 `cswap switch` 選定的帳號 ([上游 #256](https://github.com/realiti4/claude-swap/issues/256))。`cswap chrome 2` 會以你的 Chrome 設定檔的一份獨立副本開啟帳號 2。其中的擴充功能以帳號 2 執行，主瀏覽器的登入不受影響。

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2` 會把目前的 Chrome 設定檔重新複製到帳號 2。執行前請先關閉該帳號的視窗。
- `cswap config set chrome.followSwitch true` 會在 `cswap switch` 時把對應帳號的瀏覽器視窗帶到前景。
- `cswap config set chrome.appPath <path>` 可以改用其他 Chromium 核心瀏覽器，例如 Edge 或 Brave。

### 問題修正

- **帳號設定過期。** 若 `~/.claude.json` 仍指向帳號 B，而鑰匙圈中已是帳號 A 的 token，上游會要求重新登入 A，並停止重新整理 B。aswap 會以實際持有目前 token 的帳號為準。
- **版本與升級。** `--version`、更新檢查和 `upgrade` 都寫死了 `claude-swap` 套件名稱。aswap 會使用實際安裝的套件。
- **舊的紀錄設定。** 早期的 aswap 把依帳號分開保存紀錄的選擇存為 `session.shareHistory`。上游只讀取 `run.shareHistory`，而且預設共用紀錄，這個選擇會失效，各帳號的紀錄會被合併。aswap 仍會採用這個舊鍵。

## 建置方式

`upstream.json` 固定了一個上游 commit。`bun run setup` 會把該 commit 原樣複製到 `cswap/`，再依 [patches/.patches](../../patches/.patches) 中的順序，以 `git am` 套用 `patches/` 下的所有修補。這套結構參考了 [Electron 管理 Chromium 與 Node 修補的方式](https://github.com/electron/electron/tree/main/patches)。每個 diff 都保持精簡易讀，升級上游只需對修補序列做一次 rebase。

| 修補                                                                                                                       | 變更                  |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| [以目前憑證的實際擁有者為準](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | 修正：帳號設定過期    |
| [以實際安裝的發行套件為準](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)      | 修正：版本與升級      |
| [隨時重新整理用量](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)            | 功能：`cswap refresh` |
| [依帳號開啟 Claude Desktop](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)       | 功能：`cswap desktop` |
| [依帳號開啟 Chrome](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)               | 功能：`cswap chrome`  |
| [保留舊版存下的紀錄共用選擇](../../patches/fix_keep_the_share_history_choice_an_earlier_aswap_release_stored.patch)        | 修正：舊的紀錄設定    |

每個修補對應一個 commit，提交訊息中說明了對應的上游問題。若要從原始碼建置或修改修補，請參閱 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 授權

MIT，與 claude-swap 相同。詳見 [LICENSE](../../LICENSE)。
