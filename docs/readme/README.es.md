<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | Español

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

| parche                                                                                                                                                  | problema                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Seguir al verdadero propietario de la credencial activa](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | Un `~/.claude.json` obsoleto puede seguir nombrando la cuenta B cuando el llavero ya guarda el token de la cuenta A. Upstream marca entonces A como "re-login needed" y deja de refrescar B. El parche sigue al verdadero propietario y recuerda la respuesta entre ejecuciones.                                                                                                                                                                                                                                      |
| [Seguir la distribución instalada](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                           | La versión, la comprobación de actualizaciones y `upgrade` fijan el nombre `claude-swap`, así que fallan cuando la instalación es `aswap`. El parche sigue la distribución que realmente proporciona el código.                                                                                                                                                                                                                                                                                                       |
| [Refrescar el uso bajo demanda](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                            | Upstream solo consulta el uso según su propio calendario. Hasta que el serve TTL, el plan de sondeo y el backoff por fallo permiten otra petición, cada pantalla muestra el valor en caché, y nunca se muestra cuándo permite reintentar el servidor. `cswap refresh [cuenta ...]` consulta de inmediato, cada cuenta por separado, e indica cuándo puede reintentar una cuenta limitada.                                                                                                                            |
| [Conservar archivos al fusionar el historial](../../patches/fix_set_aside_a_differing_history_file_instead_of_dropping_the_profiles_copy.patch)         | Cuando `cswap run` fusiona el historial propio de un perfil en `~/.claude`, upstream trata cada archivo homónimo como duplicado y borra la copia del perfil sin leer su contenido. Una sesión continuada tras dejar de compartir, o el `memory/MEMORY.md` de un proyecto, se pierde sin aviso. El parche solo descarta una copia cuando ambos archivos son idénticos y aparta la que difiere bajo `history-conflicts/`.                                                                                               |
| [Un solo historial de conversaciones](../../patches/feat_share_one_conversation_history_across_accounts_by_default.patch)                               | Cada cuenta conserva su propio `projects/` salvo que cada lanzamiento lleve `--share-history`. Cuando la cuenta es el login predeterminado, `cswap run` omite el perfil por completo. Las sesiones de una cuenta acaban en dos sitios, y `claude --resume` no encuentra una conversación tras cambiar la cuenta predeterminada (upstream #239). El parche hace del uso compartido el valor predeterminado, lo guarda en el ajuste `session.shareHistory`, y vuelca el historial del perfil en `~/.claude` incluso en la ruta del login predeterminado. |

Cada parche es un commit. El mensaje del commit explica el problema upstream. La lista completa está en [patches/.patches](../../patches/.patches).

## Cómo está construido

El proyecto fija un commit upstream en `upstream.json`, lo clona sin cambios en `cswap/` y guarda cada modificación en `patches/` como un parche `git am` corriente. Los parches se aplican en el orden de `patches/.patches`. Es la misma organización [que Electron usa para sus parches de Node y Chromium](https://github.com/electron/electron/tree/main/patches): la diferencia se mantiene pequeña y legible, y pasar a un upstream más nuevo es un rebase de la serie. Los detalles, los comandos y el flujo de trabajo con parches están en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT, igual que claude-swap. Ver [LICENSE](../../LICENSE).
