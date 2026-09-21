<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | 日本語 | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

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

| パッチ                                                                                                                                      | 問題                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ライブ資格情報の本当の所有者に従う](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)          | 古くなった `~/.claude.json` がアカウント B を指したまま、キーチェーンにはアカウント A のトークンが入っていることがあります。上流は A を「再ログインが必要」とし、B も更新しません。このパッチは資格情報の本当の所有者に従い、その答えを実行をまたいで記憶します。                                                                                                                                  |
| [インストールされたディストリビューションに従う](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch) | バージョン、更新確認、`upgrade` が `claude-swap` という名前を直書きしており、`aswap` としてインストールすると壊れます。このパッチは実際にコードを提供するディストリビューションに従います。                                                                                                                                                                                                        |
| [使用量をその場で更新](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                         | 上流は自身のスケジュールでしか使用量を取得しません。serve TTL、ポーリング計画、失敗時のバックオフがすべて次の要求を許すまで、どの画面もキャッシュ値を表示し、サーバーが再試行を許す時刻も示しません。`cswap refresh [アカウント ...]` は今すぐ取得し、アカウントごとに独立して動き、制限中のアカウントがいつ再試行できるかを伝えます。                                                               |
| [履歴のマージでファイルを失わない](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)        | `cswap run` がプロファイル自身の履歴を `~/.claude` にマージするとき、上流は同名ファイルをすべて重複とみなし、内容を見ずにプロファイル側を削除します。共有を切ったあとに続けたセッションや、プロジェクトの `memory/MEMORY.md` が警告なしに失われます。パッチは 2 つが完全に同一のときだけ捨て、異なる方は `history-conflicts/` の下に残します。                                                         |
| [会話履歴を 1 つに共有](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                                 | 毎回 `--share-history` を付けない限り各アカウントが独自の `projects/` を持ち、そのアカウントが既定のログインだと `cswap run` はプロファイルを丸ごと飛ばします。1 つのアカウントのセッションが 2 か所に散らばり、既定を切り替えた後は `claude --resume` で会話が見つかりません (上流 #239)。パッチは共有を既定にして `session.shareHistory` 設定に保存し、既定ログインの経路でもプロファイルの履歴を `~/.claude` に取り込みます。 |

各パッチは 1 コミットです。コミットメッセージが上流の問題を説明しています。全一覧は [patches/.patches](../../patches/.patches) にあります。

## 作り方

上流の 1 コミットを `upstream.json` で固定し、改変せず `cswap/` に clone します。すべての変更は通常の `git am` パッチとして `patches/` に置き、`patches/.patches` に列挙された順で適用します。これは [Electron が Node と Chromium のパッチを管理している方式](https://github.com/electron/electron/tree/main/patches) と同じです。差分は小さく読みやすく保たれ、上流の更新はパッチ列の rebase になります。詳細、コマンド、パッチのワークフローは [CONTRIBUTING.md](../../CONTRIBUTING.md) にあります。

## ライセンス

claude-swap と同じ MIT。[LICENSE](../../LICENSE) を参照。
