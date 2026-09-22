<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | 日本語 | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Claude Code のアカウント切り替えツール：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) に、継続的にメンテナンスされる修正を重ねたものです。

</div>

`cswap` は複数の Claude アカウントを切り替え、各アカウントの利用枠を追跡し、残量が最も多いアカウントへ移せます。aswap は同じツールです。未改変の上流ソースからビルドし、上流がまだ直していない問題向けの小さなパッチを重ねています。使うコマンドはこれまで通り `cswap` です。

## 名前

aswap は **account swap** (アカウントの切り替え) の略で、このツールがすることそのものです。`cswap` と並べると、`a` はこのプロジェクトが加えるものでもあります。aswap は cswap にパッチを足したものです。Claude Code が汎用のエージェント実行環境へ育つにつれ、その `a` はそこに伴う AI やエージェントのアカウントにも対応します。

## インストール

```bash
uv tool install aswap  # または: pipx install aswap
aswap --version
```

`aswap` は `cswap` のすべての使い方を受け付けます。上流の `cswap` と並べて入り、そちらには触れません。`cswap` という名前でも aswap を実行したい場合：

```bash
aswap link  # aswap の隣に cswap ランチャーを作成。aswap unlink で削除
```

`aswap link` が置き換えるのは、自分で作った `cswap` だけです。先に上流をアンインストールする (`uv tool uninstall claude-swap`) か、`--force` を付けてください。

## アップグレード

```bash
aswap upgrade  # インストール方法に応じて uv tool upgrade aswap または pipx upgrade aswap
```

ソースからのビルドと、インストール済みの PyPI `cswap` をパッチ適用版で置き換える方法は [CONTRIBUTING.md](../../CONTRIBUTING.md) にあります。

## パッチが直すもの

`cswap refresh` は今すぐアカウントごとに利用状況を取得し、レート制限中のアカウントがいつ再試行できるかを示します:

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` は保存済みアカウントごとに Claude Desktop のウィンドウを 1 つずつ開き、それぞれがログインしたままになります:

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` はアカウント 2 を既定の Chrome プロファイルのコピーで開きます。そこでの Claude in Chrome 拡張機能はアカウント 2 として動き、既定のブラウザは元のログインのままです:

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| パッチ                                                                                                                                       | 問題                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ライブ資格情報の本当の所有者に従う](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)           | 古くなった `~/.claude.json` がアカウント B を指したまま、キーチェーンにはアカウント A のトークンが入っていることがあります。上流は A を「再ログインが必要」とし、B も更新しません。                                                                                                                                                                                                                                   |
| [インストールされたディストリビューションに従う](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)  | バージョン、更新確認、`upgrade` が名前 `claude-swap` を直書きしているため、`aswap` としてインストールすると壊れます。                                                                                                                                                                                                                                                                                                 |
| [使用量をその場で更新](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                          | 使用量は上流自身のスケジュールでしか更新されず、画面はキャッシュのままで、サーバーが再試行を許す時刻も出ません。`cswap refresh [アカウント ...]` は今すぐ、アカウントごとに取得します。                                                                                                                                                                                                                               |
| [履歴のマージでファイルを失わない](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)         | プロファイルの履歴を `~/.claude` へマージすると、同名ファイルは内容を見ずに削除され、その後のセッションや `memory/MEMORY.md` が失われます。内容が異なるファイルは `history-conflicts/` に残します。                                                                                                                                                                                                                   |
| [会話履歴を 1 つに共有](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                                  | 毎回 `--share-history` を付けないと、既定アカウントを変えたあと `claude --resume` で会話が見つかりません (上流 #239)。共有が既定です (`session.shareHistory`)。                                                                                                                                                                                                                                                       |
| [アカウントごとに Claude Desktop を開く](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)            | Claude Desktop はプロファイルごとにログインが 1 つだけで、別のアカウントは一度出て入り直す必要があります。`cswap desktop 2` はアカウント 2 を専用ウィンドウで開き、他のウィンドウも開いたままにできます。やり方は [guise](https://github.com/siddhjagani/guise) と同じです。Code タブには同じローカルセッションが並びます。                                                                                           |
| [アカウントごとに Chrome を開く (Claude in Chrome)](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | Claude in Chrome はブラウザの claude.ai ログインのままで、`cswap switch` が切り替えたアカウントには従いません (上流 #256)。`cswap chrome 2` はアカウント 2 を専用の Chrome プロファイルで開きます。そのウィンドウを閉じたあと、`cswap chrome --sync 2` で自分のプロファイルをコピーし直せます。`chrome.followSwitch` は切り替え時にウィンドウを前面へ出し、`chrome.appPath` で Edge、Brave、Chromium を指定できます。 |

各パッチは 1 コミットです。コミットメッセージが上流の問題を説明しています。全一覧は [patches/.patches](../../patches/.patches) にあります。

## 作り方

上流の 1 コミットを `upstream.json` で固定し、改変せず `cswap/` に clone します。すべての変更は通常の `git am` パッチとして `patches/` に置き、`patches/.patches` に列挙された順で適用します。これは [Electron が Node と Chromium のパッチを管理している方式](https://github.com/electron/electron/tree/main/patches) と同じです。差分は小さく読みやすく保たれ、上流の更新はパッチ列の rebase になります。詳細、コマンド、パッチのワークフローは [CONTRIBUTING.md](../../CONTRIBUTING.md) にあります。

## ライセンス

claude-swap と同じ MIT。[LICENSE](../../LICENSE) を参照。
