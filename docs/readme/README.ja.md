<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | 日本語 | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

Claude Code のアカウント切り替えツール：[claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) に、継続的にメンテナンスされる修正を重ねたものです。

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

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

| パッチ                                                                                                                                       | 問題                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ライブ資格情報の本当の所有者に従う](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)           | 古くなった `~/.claude.json` がアカウント B を指したまま、キーチェーンにはアカウント A のトークンが入っていることがあります。上流は A を「再ログインが必要」とし、B も更新しません。このパッチは資格情報の本当の所有者に従い、その答えを実行をまたいで記憶します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| [インストールされたディストリビューションに従う](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)  | バージョン、更新確認、`upgrade` が `claude-swap` という名前を直書きしており、`aswap` としてインストールすると壊れます。このパッチは実際にコードを提供するディストリビューションに従います。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [使用量をその場で更新](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                          | 上流は自身のスケジュールでしか使用量を取得しません。serve TTL、ポーリング計画、失敗時のバックオフがすべて次の要求を許すまで、どの画面もキャッシュ値を表示し、サーバーが再試行を許す時刻も示しません。`cswap refresh [アカウント ...]` は今すぐ取得し、アカウントごとに独立して動き、制限中のアカウントがいつ再試行できるかを伝えます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [履歴のマージでファイルを失わない](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)         | `cswap run` がプロファイル自身の履歴を `~/.claude` にマージするとき、上流は同名ファイルをすべて重複とみなし、内容を見ずにプロファイル側を削除します。共有を切ったあとに続けたセッションや、プロジェクトの `memory/MEMORY.md` が警告なしに失われます。パッチは 2 つが完全に同一のときだけ捨て、異なる方は `history-conflicts/` の下に残します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [会話履歴を 1 つに共有](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                                  | 毎回 `--share-history` を付けない限り各アカウントが独自の `projects/` を持ち、そのアカウントが既定のログインだと `cswap run` はプロファイルを丸ごと飛ばします。1 つのアカウントのセッションが 2 か所に散らばり、既定を切り替えた後は `claude --resume` で会話が見つかりません (上流 #239)。パッチは共有を既定にして `session.shareHistory` 設定に保存し、既定ログインの経路でもプロファイルの履歴を `~/.claude` に取り込みます。                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [アカウントごとに Claude Desktop を開く](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)            | Claude Desktop はプロファイルごとに 1 つのログインしか保持しないため、別のアカウントを使うたびにログアウトして入り直す必要があります。このパッチは保存済みの各アカウントに恒久的なデスクトップ用プロファイルを与え、[guise](https://github.com/siddhjagani/guise) と同じく `--user-data-dir` でアプリを起動します。`cswap desktop 2` はアカウント 2 を専用ウィンドウで開き、一度ログインすればそのまま保持され、他のアカウントのウィンドウも並べて開いたままにできます。Code タブのローカルセッションは既定のプロファイルと共有されるため、この方法で開いたウィンドウにも同じセッションが並びます。                                                                                                                                                                                                                                                                                      |
| [アカウントごとに Chrome を開く (Claude in Chrome)](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | `cswap switch` が切り替えるのは Claude Code で、Claude in Chrome 拡張機能はブラウザで claude.ai にログインしているアカウントのまま動きます。それは cswap が保存する資格情報とは別の cookie です (上流 #256)。この cookie を差し替えるには Chrome のストレージを復号し、別の拡張機能の状態を書き換える必要があります。このパッチは保存済みの各アカウントに恒久的な Chrome プロファイルを与え、`--user-data-dir` でブラウザを起動します。`cswap chrome 2` はアカウント 2 を専用ブラウザで開きます。それは既定の Chrome プロファイルから claude.ai の cookie を除いたコピーなので、他のサイトはログインしたまま、拡張機能もそのまま引き継がれ、そこで Claude に一度ログインすれば保持されます。各プロファイルはアカウント名が付き、固有のウィンドウ色を持ちます。すでに開いているアカウントはそのブラウザを前面に出します。`chrome.appPath` で Edge、Brave、Chromium を指すこともできます。 |

各パッチは 1 コミットです。コミットメッセージが上流の問題を説明しています。全一覧は [patches/.patches](../../patches/.patches) にあります。

`cswap refresh` は今すぐアカウントごとに利用状況を取得し、レート制限中のアカウントがいつ再試行できるかを示します:

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` は保存済みアカウントごとに Claude Desktop のウィンドウを 1 つずつ開き、それぞれがログインしたままになります:

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

## 作り方

上流の 1 コミットを `upstream.json` で固定し、改変せず `cswap/` に clone します。すべての変更は通常の `git am` パッチとして `patches/` に置き、`patches/.patches` に列挙された順で適用します。これは [Electron が Node と Chromium のパッチを管理している方式](https://github.com/electron/electron/tree/main/patches) と同じです。差分は小さく読みやすく保たれ、上流の更新はパッチ列の rebase になります。詳細、コマンド、パッチのワークフローは [CONTRIBUTING.md](../../CONTRIBUTING.md) にあります。

## ライセンス

claude-swap と同じ MIT。[LICENSE](../../LICENSE) を参照。
