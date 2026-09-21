# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | Español

Cambio de cuenta para Claude Code: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`) con un conjunto mantenido de correcciones encima.

`cswap` cambia entre varias cuentas de Claude, sigue las ventanas de uso de cada una y puede llevarte a la cuenta con más margen. aswap entrega la misma herramienta, construida a partir del código upstream sin modificar más una serie pequeña y revisable de parches para los problemas que upstream aún no ha corregido. Obtienes el comando `cswap` que ya conoces, sin las asperezas.

## El nombre

aswap es la abreviatura de **account swap**, cambio de cuenta, que es lo que hace la herramienta. Puesto junto a `cswap`, la `a` es también lo único que añade este proyecto: aswap es cswap más una serie de parches, nada más. Y a medida que Claude Code se convierte en un entorno de ejecución de agentes de propósito general, la `a` deja sitio a las cuentas que vienen con él, tanto cuentas de IA como cuentas de agentes.

## Instalación

```bash
uv tool install aswap      # o: pipx install aswap
aswap --version
```

`aswap` acepta todo lo que acepta `cswap`. Se instala junto a un `cswap` upstream sin tocarlo. Para que el nombre `cswap` también ejecute aswap:

```bash
aswap link                 # crea un lanzador cswap junto a aswap; aswap unlink lo elimina
```

`aswap link` no sobrescribe un `cswap` que no haya creado él: desinstala primero el upstream (`uv tool uninstall claude-swap`) o pasa `--force`.

## Actualización

```bash
aswap upgrade              # uv tool upgrade aswap o pipx upgrade aswap, según cómo se instaló
```

La compilación desde el código fuente y la sustitución en el sitio del `cswap` de PyPI por la versión parcheada se describen en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Qué corrigen los parches

| parche                                                                                                                                                                                                         | problema                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Seguir al verdadero propietario de la credencial activa](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch)                                                        | Varios procesos de Claude Code comparten `~/.claude.json`. Un proceso iniciado antes de un `cswap switch` aún conserva la cuenta anterior en memoria y la vuelve a escribir (en el caso medido, el native host de la extensión de Chrome lo hizo 16 segundos después del cambio). La configuración nombra entonces la cuenta B mientras el almacén de credenciales aún guarda el token de la cuenta A. Upstream se fía de la etiqueta: trata a A como inactiva, envía el refresh token de respaldo de A ya consumido, recibe `invalid_grant` y muestra para A un falso "re-login needed"; B recibe el token ajeno de A y nunca se refresca desde su propio respaldo. Ambas cuentas se detienen y la pantalla culpa a A. El parche atribuye la credencial activa a su verdadero propietario, recuerda la respuesta entre ejecuciones, deja que la otra cuenta siga refrescándose desde su propio respaldo y repara el respaldo condenado por error. |
| [Seguir la distribución realmente instalada para la versión, la comprobación de actualizaciones y la actualización](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch) | Upstream fija la distribución `claude-swap` en su versión, en su comprobación de actualizaciones en PyPI y en `cswap upgrade`. Instalado como `aswap`, fallaría al importar, avisaría de la versión de claude-swap en cada ejecución y actualizaría el paquete equivocado. El parche lee los metadatos instalados y sigue la distribución que realmente proporciona el código.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Cada parche es un commit cuyo mensaje explica el problema upstream. La lista completa está en [patches/.patches](../../patches/.patches).

## Cómo está construido

El upstream no se bifurca. Se incorpora sin cambios como git submodule en `cswap/`, y cada modificación vive en `patches/` como un parche `git am` corriente, aplicado en el orden que indica `patches/.patches`. Es la misma organización [que Electron usa para sus parches de Node y Chromium](https://github.com/electron/electron/tree/main/patches): la diferencia se mantiene pequeña y legible, y pasar a un upstream más nuevo es un rebase de la serie en lugar de un merge. Los detalles, los comandos y el flujo de trabajo con parches están en [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT, igual que claude-swap. Ver [LICENSE](../../LICENSE).
