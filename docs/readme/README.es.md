<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | Español

Cambio de cuenta para Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) con un conjunto mantenido de correcciones encima.

</div>

`cswap` cambia entre varias cuentas de Claude, sigue las ventanas de uso de cada una y puede llevarte a la cuenta con más margen. aswap entrega la misma herramienta, construida a partir del código upstream sin modificar más una serie pequeña y revisable de parches para los problemas que upstream aún no ha corregido. Obtienes el comando `cswap` que ya conoces, sin las asperezas.

## El nombre

aswap es la abreviatura de **account swap**, cambio de cuenta, que es lo que hace la herramienta. Puesto junto a `cswap`, la `a` es también lo único que añade este proyecto: aswap es cswap más una serie de parches, nada más. Y a medida que Claude Code se convierte en un entorno de ejecución de agentes de propósito general, la `a` deja sitio a las cuentas que vienen con él, tanto cuentas de IA como cuentas de agentes.

## Instalación

```bash
uv tool install aswap  # o: pipx install aswap
aswap --version
```

`aswap` acepta todo lo que acepta `cswap`. Se instala junto a un `cswap` upstream sin tocarlo. Para que el nombre `cswap` también ejecute aswap:

```bash
aswap link  # crea un lanzador cswap junto a aswap; aswap unlink lo elimina
```

`aswap link` no sobrescribe un `cswap` que no haya creado él: desinstala primero el upstream (`uv tool uninstall claude-swap`) o pasa `--force`.

## Actualización

```bash
aswap upgrade  # uv tool upgrade aswap o pipx upgrade aswap, según cómo se instaló
```

La compilación desde el código fuente y la sustitución en el sitio del `cswap` de PyPI por la versión parcheada se describen en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Qué corrigen los parches

| parche                                                                                                                                                  | problema                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Seguir al verdadero propietario de la credencial activa](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | Un `~/.claude.json` obsoleto puede nombrar la cuenta B mientras el llavero guarda el token de la cuenta A. Upstream marca entonces A como "re-login needed" por error y deja de refrescar B. El parche sigue al verdadero propietario y recuerda la respuesta entre ejecuciones. |
| [Seguir la distribución instalada](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                           | La versión, la comprobación de actualizaciones y `upgrade` fijan `claude-swap`; instalados como `aswap`, fallan. El parche sigue la distribución que realmente proporciona el código.                                                                                            |

Cada parche es un commit cuyo mensaje explica el problema upstream. La lista completa está en [patches/.patches](../../patches/.patches).

## Cómo está construido

El upstream no se bifurca. Se fija a un commit en `upstream.json` y se clona sin cambios en `cswap/`, y cada modificación vive en `patches/` como un parche `git am` corriente, aplicado en el orden que indica `patches/.patches`. Es la misma organización [que Electron usa para sus parches de Node y Chromium](https://github.com/electron/electron/tree/main/patches): la diferencia se mantiene pequeña y legible, y pasar a un upstream más nuevo es un rebase de la serie en lugar de un merge. Los detalles, los comandos y el flujo de trabajo con parches están en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT, igual que claude-swap. Ver [LICENSE](../../LICENSE).
