<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | Français | [Español](README.es.md)

Changement de compte pour Claude Code : [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) avec un ensemble de correctifs maintenus par-dessus.

</div>

`cswap` bascule entre plusieurs comptes Claude, suit les fenêtres d'utilisation de chacun et peut vous déplacer vers le compte qui a le plus de marge. aswap livre le même outil, construit à partir des sources upstream non modifiées plus une petite série de patches relisibles pour les problèmes qu'upstream n'a pas encore corrigés. Vous retrouvez la commande `cswap` que vous connaissez, sans les aspérités.

## Le nom

aswap est l'abréviation d'**account swap**, le changement de compte, c'est-à-dire ce que fait l'outil. Placé à côté de `cswap`, le `a` est aussi la seule chose que ce projet ajoute : aswap, c'est cswap plus une série de patches, rien d'autre. Et à mesure que Claude Code devient un environnement d'exécution d'agents à part entière, le `a` laisse de la place aux comptes qui l'accompagnent, comptes d'IA comme comptes d'agents.

## Installation

```bash
uv tool install aswap  # ou : pipx install aswap
aswap --version
```

`aswap` accepte tout ce que `cswap` accepte. Il s'installe à côté d'un `cswap` upstream sans y toucher. Pour que le nom `cswap` lance aussi aswap :

```bash
aswap link  # crée un lanceur cswap à côté d'aswap ; aswap unlink le retire
```

`aswap link` refuse d'écraser un `cswap` qu'il n'a pas créé : désinstallez d'abord l'upstream (`uv tool uninstall claude-swap`) ou passez `--force`.

## Mise à jour

```bash
aswap upgrade  # uv tool upgrade aswap ou pipx upgrade aswap, selon l'installation
```

La compilation depuis les sources et le remplacement sur place du `cswap` de PyPI par la version patchée sont décrits dans [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Ce que corrigent les patches

| patch                                                                                                                                              | problème                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Suivre le vrai propriétaire de l'identifiant actif](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | Un `~/.claude.json` périmé peut nommer le compte B alors que le trousseau contient le jeton du compte A. L'upstream marque alors A « re-login needed » à tort et ne rafraîchit plus B. Le patch suit le vrai propriétaire et mémorise la réponse d'une exécution à l'autre. |
| [Suivre la distribution installée](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                      | La version, la vérification de mise à jour et `upgrade` codent en dur `claude-swap` ; installés sous `aswap`, ils cassent. Le patch suit la distribution qui fournit réellement le code.                                                                                    |

Chaque patch est un commit dont le message explique le problème upstream. La liste complète est dans [patches/.patches](../../patches/.patches).

## Comment c'est construit

L'upstream n'est pas forké. Il est intégré tel quel comme git submodule dans `cswap/`, et chaque modification vit dans `patches/` sous forme de patch `git am` ordinaire, appliqué dans l'ordre listé par `patches/.patches`. C'est [l'organisation qu'Electron utilise pour ses patches Node et Chromium](https://github.com/electron/electron/tree/main/patches) : le delta reste petit et lisible, et passer à un upstream plus récent est un rebase de la série plutôt qu'un merge. Les détails, les commandes et le workflow des patches sont dans [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licence

MIT, comme claude-swap. Voir [LICENSE](../../LICENSE).
