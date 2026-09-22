<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | Español

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Cambio de cuenta para Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) con un conjunto mantenido de correcciones.

</div>

`cswap` cambia entre varias cuentas de Claude, sigue el uso de cada una y puede pasarte a la cuenta con más cuota restante. aswap es la misma herramienta, construida a partir del código upstream sin modificar más una serie pequeña de parches para los fallos que upstream aún no ha corregido. Sigues ejecutando `cswap`.

## El nombre

aswap es la abreviatura de **account swap**, cambio de cuenta, que es lo que hace la herramienta. Junto a `cswap`, la `a` es también lo que añade este proyecto: aswap es cswap más una serie de parches. A medida que Claude Code se convierte en un entorno de ejecución de agentes, esa misma `a` encaja también con las cuentas de IA y de agentes que vienen con ese cambio.

## Instalación

```bash
uv tool install aswap  # o: pipx install aswap
aswap --version
```

`aswap` acepta todos los comandos de `cswap`. Se instala junto a un `cswap` upstream sin modificarlo. Para ejecutar aswap también con el nombre `cswap`:

```bash
aswap link  # crea un lanzador cswap junto a aswap; aswap unlink lo elimina
```

`aswap link` solo sustituye un `cswap` que haya creado él. Desinstala primero el upstream (`uv tool uninstall claude-swap`) o pasa `--force`.

## Actualización

```bash
aswap upgrade  # uv tool upgrade aswap o pipx upgrade aswap, según cómo se instaló
```

La compilación desde el código fuente y la sustitución del `cswap` de PyPI ya instalado por la versión parcheada se describen en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Qué corrigen los parches

`cswap refresh` obtiene el uso ahora mismo, cuenta por cuenta, e indica cuándo puede reintentar una cuenta limitada:

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

`cswap desktop --all` abre una ventana de Claude Desktop por cada cuenta guardada, cada una con su propia sesión iniciada:

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

`cswap chrome 2` abre la cuenta 2 en su propia copia del perfil de Chrome habitual, así que la extensión Claude in Chrome allí actúa como la cuenta 2 mientras el navegador habitual conserva su sesión:

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

| parche                                                                                                                                                  | problema                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Seguir al verdadero propietario de la credencial activa](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | Un `~/.claude.json` obsoleto puede seguir nombrando la cuenta B cuando el llavero ya guarda el token de la cuenta A. Upstream marca entonces A como "re-login needed" y deja de refrescar B.                                                                                                                                                                                             |
| [Seguir la distribución instalada](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                           | La versión, la comprobación de actualizaciones y `upgrade` fijan el nombre `claude-swap`, así que fallan cuando la instalación es `aswap`.                                                                                                                                                                                                                                               |
| [Refrescar el uso bajo demanda](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                            | Upstream solo refresca el uso según su propio calendario, así que las pantallas siguen mostrando la caché y no dicen cuándo permite reintentar el servidor. `cswap refresh [cuenta ...]` consulta de inmediato, cuenta por cuenta.                                                                                                                                                       |
| [Conservar archivos al fusionar el historial](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)         | Al fusionar el historial de un perfil en `~/.claude`, cada archivo homónimo se borra sin leerlo, y se puede perder una sesión posterior o `memory/MEMORY.md`. Un archivo distinto se conserva bajo `history-conflicts/`.                                                                                                                                                                 |
| [Un solo historial de conversaciones](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                               | Sin `--share-history` en cada lanzamiento, `claude --resume` no encuentra la conversación tras cambiar la cuenta predeterminada (upstream #239). Compartir es ahora el valor predeterminado (`session.shareHistory`).                                                                                                                                                                    |
| [Abrir Claude Desktop por cuenta](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)                              | Claude Desktop guarda un solo login por perfil, así que una segunda cuenta obliga a cerrar sesión y volver a entrar. `cswap desktop 2` abre la cuenta 2 en su propia ventana, como hace [guise](https://github.com/siddhjagani/guise), y deja las demás abiertas. La pestaña Code sigue mostrando las mismas sesiones locales.                                                           |
| [Abrir Chrome por cuenta para Claude in Chrome](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)                | Claude in Chrome sigue la cookie de claude.ai del navegador, no la cuenta que eligió `cswap switch` (upstream #256). `cswap chrome 2` abre la cuenta 2 en su propio perfil de Chrome. Con esa ventana cerrada, `cswap chrome --sync 2` vuelve a copiar tu perfil. `chrome.followSwitch` trae la ventana al frente al cambiar, y `chrome.appPath` puede apuntar a Edge, Brave o Chromium. |

Cada parche es un commit. El mensaje del commit explica el problema upstream. La lista completa está en [patches/.patches](../../patches/.patches).

## Cómo está construido

El proyecto fija un commit upstream en `upstream.json`, lo clona sin cambios en `cswap/` y guarda cada modificación en `patches/` como un parche `git am` corriente. Los parches se aplican en el orden de `patches/.patches`. Es la misma organización [que Electron usa para sus parches de Node y Chromium](https://github.com/electron/electron/tree/main/patches): la diferencia se mantiene pequeña y legible, y pasar a un upstream más nuevo es un rebase de la serie. Los detalles, los comandos y el flujo de trabajo con parches están en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT, igual que claude-swap. Ver [LICENSE](../../LICENSE).
