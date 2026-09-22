<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | Русский | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Переключение аккаунтов для Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) с поддерживаемым набором исправлений.

</div>

`cswap` переключает несколько аккаунтов Claude, отслеживает использование каждого и может перевести вас на аккаунт с наибольшим остатком квоты. aswap - тот же инструмент: неизмененный исходный код upstream плюс небольшая серия патчей для ошибок, которые upstream еще не исправил. Вы по-прежнему запускаете `cswap`.

## Название

aswap - сокращение от **account swap** (переключение аккаунтов), то есть от того, что делает инструмент. Рядом с `cswap` буква `a` - это и то, что добавляет проект: aswap это cswap плюс серия патчей. По мере того как Claude Code становится универсальной средой для агентов, та же `a` подходит и к аккаунтам AI и агентов, которые приходят вместе с этим.

## Установка

```bash
uv tool install aswap  # или: pipx install aswap
aswap --version
```

`aswap` принимает все команды `cswap`. Он ставится рядом с upstream `cswap` и не меняет его. Чтобы имя `cswap` тоже запускало aswap:

```bash
aswap link  # создает лаунчер cswap рядом с aswap; aswap unlink удаляет его
```

`aswap link` заменяет только тот `cswap`, который создал сам. Сначала удалите upstream (`uv tool uninstall claude-swap`) или передайте `--force`.

## Обновление

```bash
aswap upgrade  # uv tool upgrade aswap или pipx upgrade aswap, в зависимости от способа установки
```

Сборка из исходников и замена установленного `cswap` из PyPI пропатченной сборкой описаны в [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Что исправляют патчи

`cswap refresh` запрашивает использование прямо сейчас, по одному аккаунту за раз, и показывает, когда аккаунт, ограниченный по частоте запросов, сможет повторить попытку:

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` открывает по одному окну Claude Desktop на каждый сохраненный аккаунт, каждое со своим входом:

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` открывает аккаунт 2 в собственной копии обычного профиля Chrome, так что расширение Claude in Chrome там работает как аккаунт 2, а обычный браузер сохраняет свой вход:

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| патч                                                                                                                                                | проблема                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Следовать за настоящим владельцем учетных данных](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)    | Устаревший `~/.claude.json` может по-прежнему указывать на аккаунт B, пока в keychain уже лежит токен аккаунта A. Upstream помечает A как "re-login needed" и перестает обновлять B.                                                                                                                                                                                                              |
| [Следовать за установленным дистрибутивом](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)               | Версия, проверка обновлений и `upgrade` жестко прописывают имя `claude-swap`, поэтому при установке как `aswap` они ломаются.                                                                                                                                                                                                                                                                     |
| [Обновить usage по запросу](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                            | Upstream обновляет usage только по своему расписанию, поэтому экраны показывают кэш и не пишут срок повтора от сервера. `cswap refresh [аккаунт ...]` запрашивает сразу, по одному аккаунту.                                                                                                                                                                                                      |
| [Слияние истории без потерь](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)                      | При слиянии истории профиля в `~/.claude` одноимённые файлы удаляются без чтения, и пропадает поздняя сессия или `memory/MEMORY.md`. Отличающийся файл остается в `history-conflicts/`.                                                                                                                                                                                                           |
| [Одна история диалогов на все аккаунты](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                         | Без `--share-history` при каждом запуске `claude --resume` не находит диалог после смены аккаунта по умолчанию (upstream #239). Общая история теперь включена по умолчанию (`session.shareHistory`).                                                                                                                                                                                              |
| [Открыть Claude Desktop под каждым аккаунтом](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)              | Claude Desktop хранит один логин на профиль, поэтому второй аккаунт означает выход и вход заново. `cswap desktop 2` открывает аккаунт 2 в своем окне и оставляет остальные открытыми, как [guise](https://github.com/siddhjagani/guise). Вкладка Code показывает те же локальные сессии.                                                                                                          |
| [Открыть Chrome под каждым аккаунтом для Claude in Chrome](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch) | Claude in Chrome остается на cookie claude.ai в браузере, а не на аккаунте, который выбрал `cswap switch` (upstream #256). `cswap chrome 2` открывает аккаунт 2 в своем профиле Chrome. После закрытия этого окна `cswap chrome --sync 2` снова копирует ваш профиль. `chrome.followSwitch` выводит окно вперед при переключении, а `chrome.appPath` может указывать на Edge, Brave или Chromium. |

Каждый патч - один коммит. Сообщение коммита объясняет проблему upstream. Полный список в [patches/.patches](../../patches/.patches).

## Как это собрано

Проект закрепляет один коммит upstream в `upstream.json`, клонирует его без изменений в `cswap/` и хранит каждое изменение в `patches/` как обычный патч для `git am`. Патчи применяются в порядке из `patches/.patches`. Так же [Electron управляет патчами для Node и Chromium](https://github.com/electron/electron/tree/main/patches): дельта остается небольшой и читаемой, переход на новый upstream - это rebase серии. Подробности, команды и рабочий процесс с патчами описаны в [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Лицензия

MIT, как и у claude-swap. См. [LICENSE](../../LICENSE).
