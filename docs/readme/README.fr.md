<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | Français | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Changement de compte pour Claude Code : [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) avec un ensemble de correctifs maintenus.

</div>

`cswap` bascule entre plusieurs comptes Claude, suit l'utilisation de chacun et peut vous passer sur le compte qui a le plus de quota restant. aswap est le même outil, construit à partir des sources upstream non modifiées plus une petite série de patches pour les bugs qu'upstream n'a pas encore corrigés. Vous lancez toujours `cswap`.

## Le nom

aswap est l'abréviation d'**account swap**, le changement de compte, c'est ce que fait l'outil. À côté de `cswap`, le `a` est aussi ce que ce projet ajoute : aswap, c'est cswap plus une série de patches. À mesure que Claude Code devient un environnement d'exécution d'agents, ce même `a` convient aussi aux comptes d'IA et d'agents qui l'accompagnent.

## Installation

```bash
uv tool install aswap  # ou : pipx install aswap
aswap --version
```

`aswap` accepte toutes les commandes de `cswap`. Il s'installe à côté d'un `cswap` upstream sans le modifier. Pour lancer aswap aussi sous le nom `cswap` :

```bash
aswap link  # crée un lanceur cswap à côté d'aswap ; aswap unlink le retire
```

`aswap link` ne remplace qu'un `cswap` qu'il a lui-même créé. Désinstallez d'abord l'upstream (`uv tool uninstall claude-swap`) ou passez `--force`.

## Mise à jour

```bash
aswap upgrade  # uv tool upgrade aswap ou pipx upgrade aswap, selon l'installation
```

La compilation depuis les sources et le remplacement du `cswap` PyPI déjà installé par la version patchée sont décrits dans [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Ce que corrigent les patches

`cswap refresh` récupère l'utilisation immédiatement, compte par compte, et indique quand un compte limité pourra réessayer :

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` ouvre une fenêtre Claude Desktop par compte enregistré, chacune connectée séparément :

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` ouvre le compte 2 dans sa propre copie du profil Chrome habituel : l'extension Claude in Chrome y agit comme le compte 2 tandis que le navigateur habituel garde sa connexion :

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| patch                                                                                                                                              | problème                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Suivre le vrai propriétaire de l'identifiant actif](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | Un `~/.claude.json` périmé peut encore nommer le compte B alors que le trousseau contient déjà le jeton du compte A. L'upstream marque alors A « re-login needed » et ne rafraîchit plus B.                                                                                                                                                                                                          |
| [Suivre la distribution installée](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                      | La version, la vérification de mise à jour et `upgrade` codent en dur le nom `claude-swap`, donc ils cassent quand l'installation s'appelle `aswap`.                                                                                                                                                                                                                                                 |
| [Rafraîchir l'usage à la demande](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                     | L'upstream ne rafraîchit l'usage que selon son propre calendrier : les écrans gardent le cache et ne montrent pas l'heure de retry du serveur. `cswap refresh [compte ...]` interroge tout de suite, compte par compte.                                                                                                                                                                              |
| [Fusion d'historique sans perte](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)                 | Fusionner l'historique d'un profil dans `~/.claude` supprime chaque fichier homonyme sans le lire : une session plus tardive ou `memory/MEMORY.md` peut disparaître. Un fichier différent est conservé sous `history-conflicts/`.                                                                                                                                                                    |
| [Un seul historique de conversations](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                          | Sans `--share-history` à chaque lancement, `claude --resume` ne retrouve plus la conversation après un changement de compte par défaut (upstream #239). Le partage est maintenant la valeur par défaut (`session.shareHistory`).                                                                                                                                                                     |
| [Ouvrir Claude Desktop par compte](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)                        | Claude Desktop ne garde qu'un login par profil, donc un second compte oblige à se déconnecter et se reconnecter. `cswap desktop 2` ouvre le compte 2 dans sa propre fenêtre, comme [guise](https://github.com/siddhjagani/guise), et laisse les autres ouvertes. L'onglet Code liste les mêmes sessions locales.                                                                                     |
| [Ouvrir Chrome par compte pour Claude in Chrome](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)          | Claude in Chrome suit le cookie claude.ai du navigateur, pas le compte choisi par `cswap switch` (upstream #256). `cswap chrome 2` ouvre le compte 2 dans son propre profil Chrome. Une fois cette fenêtre fermée, `cswap chrome --sync 2` recopie votre profil. `chrome.followSwitch` ramène la fenêtre au premier plan lors du changement, et `chrome.appPath` peut viser Edge, Brave ou Chromium. |

Chaque patch est un commit. Le message du commit explique le problème upstream. La liste complète est dans [patches/.patches](../../patches/.patches).

## Comment c'est construit

Le projet épingle un commit upstream dans `upstream.json`, le clone tel quel dans `cswap/`, et place chaque modification dans `patches/` sous forme de patch `git am` ordinaire. Les patches s'appliquent dans l'ordre de `patches/.patches`. C'est [l'organisation qu'Electron utilise pour ses patches Node et Chromium](https://github.com/electron/electron/tree/main/patches) : le delta reste petit et lisible, et passer à un upstream plus récent est un rebase de la série. Les détails, les commandes et le workflow des patches sont dans [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licence

MIT, comme claude-swap. Voir [LICENSE](../../LICENSE).
