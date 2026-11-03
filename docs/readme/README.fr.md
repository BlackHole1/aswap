<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | Français | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Changez de compte Claude Code avec [claude-swap](https://github.com/realiti4/claude-swap), complété par un ensemble maintenu de correctifs et de fonctionnalités.

</div>

`cswap` gère plusieurs comptes Claude. Il suit la consommation de chaque compte et peut basculer vers celui qui dispose du plus de quota restant. aswap compile `cswap` à partir du code source amont non modifié, puis applique par-dessus un petit ensemble de patchs. Toutes les commandes `cswap` fonctionnent comme avant.

Le nom signifie **account swap**.

## Installation

```bash
uv tool install aswap  # ou : pipx install aswap
aswap --version
```

`aswap` accepte toutes les commandes `cswap`. Il s'installe à côté d'un `cswap` amont sans y toucher.

Pour lancer aussi aswap sous le nom `cswap` :

```bash
aswap link    # ajoute un lanceur cswap à côté d'aswap
aswap unlink  # le supprime
```

`aswap link` ne remplace qu'un lanceur `cswap` créé par une installation d'aswap. Pour remplacer le `cswap` amont, désinstallez-le d'abord (`uv tool uninstall claude-swap`) ou passez `--force`.

Pour mettre à jour, lancez `aswap upgrade`. La commande appelle `uv tool upgrade` ou `pipx upgrade`, selon la méthode d'installation d'aswap.

## Ce qu'apporte aswap

### Actualiser la consommation à la demande

`cswap refresh [account ...]` récupère immédiatement la consommation, un compte après l'autre. Pour un compte limité en débit, il indique à partir de quand le serveur autorise une nouvelle tentative.

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### Une fenêtre Claude Desktop par compte

Claude Desktop ne garde qu'une connexion à la fois. `cswap desktop 2` ouvre le compte 2 dans sa propre fenêtre, avec sa propre connexion, et `cswap desktop --all` ouvre tous les comptes. L'onglet Code de chaque fenêtre affiche les mêmes sessions locales (sauf sous Windows). L'approche s'inspire de [guise](https://github.com/siddhjagani/guise).

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### Un profil Chrome par compte

Claude in Chrome utilise la connexion claude.ai du navigateur, et non le compte choisi avec `cswap switch` ([upstream #256](https://github.com/realiti4/claude-swap/issues/256)). `cswap chrome 2` ouvre le compte 2 dans une copie distincte de votre profil Chrome. L'extension y fonctionne avec le compte 2, et votre navigateur principal conserve sa propre connexion.

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2` recopie votre profil Chrome actuel dans le compte 2. Fermez d'abord sa fenêtre.
- `cswap config set chrome.followSwitch true` met au premier plan le navigateur du compte lors d'un `cswap switch`.
- `cswap config set chrome.appPath <path>` utilise un autre navigateur Chromium, comme Edge ou Brave.

### Historique des conversations partagé

Par défaut, `cswap run` partage un même historique des conversations entre tous les comptes. Après un changement de compte, `claude --resume` retrouve les conversations précédentes ([upstream #239](https://github.com/realiti4/claude-swap/issues/239)). Pour conserver un historique par compte, lancez `cswap config set run.shareHistory false`. Non pris en charge sous Windows.

### Corrections de bugs

- **Configuration de compte obsolète.** Si `~/.claude.json` désigne encore le compte B alors que le trousseau contient le jeton du compte A, la version amont redemande une connexion au compte A et cesse d'actualiser le compte B. aswap suit le compte auquel appartient le jeton actif.
- **Fichiers d'historique perdus.** Lorsque la version amont fusionne l'historique d'un profil dans `~/.claude`, elle supprime les fichiers de même nom sans les comparer. Une session ou `memory/MEMORY.md` peut ainsi être perdu. aswap met de côté les fichiers divergents dans `history-conflicts/`.
- **Version et mise à jour.** `--version`, la vérification des mises à jour et `upgrade` sont codés en dur sur le paquet `claude-swap`. aswap utilise le paquet à partir duquel il a été installé.

## Construction

`upstream.json` fixe un commit amont. `bun run setup` clone ce commit tel quel dans `cswap/`, puis applique avec `git am` chaque patch de `patches/`, dans l'ordre indiqué par [patches/.patches](../../patches/.patches). Cette organisation reprend [celle qu'utilise Electron pour ses patchs Chromium et Node](https://github.com/electron/electron/tree/main/patches). Chaque diff reste court et lisible, et passer à une version amont plus récente revient à rebaser la série.

| Patch                                                                                                                                                     | Changement                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [Suivre le propriétaire de l'identifiant actif](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)             | Correctif : configuration de compte obsolète          |
| [Suivre la distribution installée](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                             | Correctif : version et mise à jour                    |
| [Actualiser la consommation à la demande](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                    | Fonctionnalité : `cswap refresh`                      |
| [Conserver les fichiers d'historique lors de la fusion](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch) | Correctif : fichiers d'historique perdus              |
| [Partager un même historique des conversations](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                       | Fonctionnalité : historique des conversations partagé |
| [Ouvrir Claude Desktop par compte](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)                               | Fonctionnalité : `cswap desktop`                      |
| [Ouvrir Chrome par compte](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)                                       | Fonctionnalité : `cswap chrome`                       |

Chaque patch est un commit unique, dont le message explique le problème amont. Pour compiler depuis les sources ou travailler sur les patchs, consultez [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licence

MIT, comme claude-swap. Voir [LICENSE](../../LICENSE).
