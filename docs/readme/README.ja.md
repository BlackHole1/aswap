<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | 日本語 | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

[claude-swap](https://github.com/realiti4/claude-swap) による Claude Code のアカウント切り替えに、継続的にメンテナンスされる修正と機能を加えたものです。

</div>

`cswap` は複数の Claude アカウントを管理します。各アカウントの使用量を記録し、残りクォータが最も多いアカウントに切り替えられます。aswap は改変していない上流ソースから `cswap` をビルドし、その上に少数のパッチを適用します。`cswap` のコマンドはすべてこれまでどおり使えます。

名前は **account swap** の略です。

## インストール

```bash
uv tool install aswap  # または: pipx install aswap
aswap --version
```

`aswap` は `cswap` のすべてのコマンドを受け付けます。上流の `cswap` と並べてインストールでき、既存の `cswap` には手を加えません。

aswap を `cswap` の名前でも実行するには：

```bash
aswap link    # aswap の隣に cswap ランチャーを追加
aswap unlink  # ランチャーを削除
```

`aswap link` が置き換えるのは、aswap のインストールで作成された `cswap` ランチャーだけです。上流の `cswap` を置き換えるには、先に `uv tool uninstall claude-swap` でアンインストールするか、`--force` を指定してください。

アップグレードするには `aswap upgrade` を実行します。aswap のインストール方法に応じて `uv tool upgrade` または `pipx upgrade` を呼び出します。

## aswap の追加内容

### 使用量をオンデマンドで更新

`cswap refresh [account ...]` は、アカウントを 1 つずつ順に処理して使用量をすぐに取得します。レート制限中のアカウントについては、サーバーが次の再試行を許可する時刻を表示します。

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### アカウントごとに Claude Desktop のウィンドウを開く

Claude Desktop が保持できるログインは一度に 1 つだけです。`cswap desktop 2` はアカウント 2 を専用のウィンドウと専用のログインで開き、`cswap desktop --all` はすべてのアカウントを開きます。各ウィンドウの Code タブには同じローカルセッションが表示されます (Windows を除く)。この方式は [guise](https://github.com/siddhjagani/guise) にならったものです。

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### アカウントごとに Chrome プロファイルを分ける

Claude in Chrome は、`cswap switch` で選んだアカウントではなく、ブラウザーの claude.ai ログインを使います ([上流 #256](https://github.com/realiti4/claude-swap/issues/256))。`cswap chrome 2` は、Chrome プロファイルを別にコピーしたものでアカウント 2 を開きます。そこでは拡張機能がアカウント 2 として動作し、普段使うブラウザーのログインはそのまま残ります。

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2` は、現在の Chrome プロファイルをアカウント 2 にもう一度コピーします。先にそのウィンドウを閉じてください。
- `cswap config set chrome.followSwitch true` を設定すると、`cswap switch` の際にそのアカウントのブラウザーを前面に表示します。
- `cswap config set chrome.appPath <path>` を設定すると、Edge や Brave など別の Chromium 系ブラウザーを使えます。

### 会話履歴の共有

`cswap run` は、デフォルトですべてのアカウントで 1 つの会話履歴を共有します。アカウントを切り替えた後も、`claude --resume` で以前の会話を見つけられます ([上流 #239](https://github.com/realiti4/claude-swap/issues/239))。履歴をアカウントごとに分けるには、`cswap config set run.shareHistory false` を実行します。Windows には対応していません。

### バグ修正

- **古いアカウント設定。** `~/.claude.json` がまだアカウント B を指しているのに、キーチェーンにはアカウント A のトークンがある場合、上流は A への再ログインを求め、B の更新を止めてしまいます。aswap は、現在有効なトークンを持つアカウントに従います。
- **履歴ファイルの消失。** 上流はプロファイルの履歴を `~/.claude` にマージする際、同名のファイルを比較せずに削除します。そのため、セッションや `memory/MEMORY.md` が失われることがあります。aswap は内容の異なるファイルを `history-conflicts/` に退避します。
- **バージョンとアップグレード。** `--version`、更新チェック、`upgrade` は `claude-swap` パッケージを前提にハードコードされています。aswap はインストール元のパッケージを使います。

## ビルドの仕組み

`upstream.json` は上流のコミットを 1 つ固定します。`bun run setup` はそのコミットを改変せずに `cswap/` へクローンし、続いて `patches/` 内のすべてのパッチを [patches/.patches](../../patches/.patches) に記載された順に `git am` で適用します。これは [Electron が Chromium と Node のパッチに使っている構成](https://github.com/electron/electron/tree/main/patches) にならったものです。各差分は小さく読みやすいままで、新しい上流への移行はパッチ列のリベースで済みます。

| パッチ                                                                                                                                    | 変更内容                         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [有効な認証情報の所有者に従う](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)              | 修正：古いアカウント設定         |
| [インストール元のディストリビューションに従う](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch) | 修正：バージョンとアップグレード |
| [使用量をオンデマンドで更新](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                 | 機能：`cswap refresh`            |
| [マージ時に履歴ファイルを保持](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)          | 修正：履歴ファイルの消失         |
| [会話履歴を共有](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                                      | 機能：会話履歴の共有             |
| [アカウントごとに Claude Desktop を開く](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)         | 機能：`cswap desktop`            |
| [アカウントごとに Chrome を開く](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)                 | 機能：`cswap chrome`             |

各パッチは 1 つのコミットで、コミットメッセージで上流の問題を説明しています。ソースからのビルドやパッチの作業については [CONTRIBUTING.md](../../CONTRIBUTING.md) を参照してください。

## ライセンス

claude-swap と同じく MIT です。[LICENSE](../../LICENSE) を参照してください。
