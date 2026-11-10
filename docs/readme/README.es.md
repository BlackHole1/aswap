<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [Français](README.fr.md) | Español

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

Cambia entre cuentas de Claude Code con [claude-swap](https://github.com/realiti4/claude-swap), más un conjunto mantenido de correcciones y funciones.

</div>

`cswap` gestiona varias cuentas de Claude. Registra el uso de cada cuenta y puede cambiar a la que tenga más cuota disponible. aswap compila `cswap` a partir del código fuente original sin modificar y le aplica un pequeño conjunto de parches. Todos los comandos de `cswap` funcionan igual que antes.

El nombre significa **account swap** (cambio de cuenta).

## Instalación

```bash
uv tool install aswap  # o: pipx install aswap
aswap --version
```

`aswap` acepta todos los comandos de `cswap`. Se instala junto a un `cswap` original sin modificarlo.

Para ejecutar aswap también como `cswap`:

```bash
aswap link    # añade un lanzador cswap junto a aswap
aswap unlink  # lo elimina
```

`aswap link` solo reemplaza un lanzador `cswap` creado por una instalación de aswap. Para reemplazar el `cswap` original, desinstálalo primero (`uv tool uninstall claude-swap`) o usa `--force`.

Para actualizar, ejecuta `aswap upgrade`. Llama a `uv tool upgrade` o a `pipx upgrade`, según cómo se haya instalado aswap.

## Qué añade aswap

### Actualizar el uso bajo demanda

`cswap refresh [account ...]` consulta el uso al momento, cuenta por cuenta. Si una cuenta ha alcanzado el límite de solicitudes, muestra cuándo permite el servidor el siguiente intento.

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### Una ventana de Claude Desktop por cuenta

Claude Desktop solo admite un inicio de sesión a la vez. `cswap desktop 2` abre la cuenta 2 en su propia ventana, con su propio inicio de sesión, y `cswap desktop --all` abre todas las cuentas. La pestaña Code de cada ventana muestra las mismas sesiones locales (excepto en Windows). El enfoque se basa en [guise](https://github.com/siddhjagani/guise).

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### Un perfil de Chrome por cuenta

Claude in Chrome usa la sesión de claude.ai del navegador, no la cuenta elegida con `cswap switch` ([upstream #256](https://github.com/realiti4/claude-swap/issues/256)). `cswap chrome 2` abre la cuenta 2 en una copia independiente de tu perfil de Chrome. Allí la extensión funciona con la cuenta 2, y tu navegador principal conserva su propia sesión.

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2` vuelve a copiar tu perfil actual de Chrome en la cuenta 2. Cierra antes su ventana.
- `cswap config set chrome.followSwitch true` trae al frente el navegador de la cuenta al ejecutar `cswap switch`.
- `cswap config set chrome.appPath <path>` usa otro navegador basado en Chromium, como Edge o Brave.

### Correcciones de errores

- **Configuración de cuenta obsoleta.** Si `~/.claude.json` todavía indica la cuenta B mientras el llavero guarda el token de la cuenta A, el `cswap` original pide volver a iniciar sesión en A y deja de actualizar B. aswap sigue a la cuenta propietaria del token activo.
- **Versión y actualización.** `--version`, la comprobación de actualizaciones y `upgrade` tienen fijado en el código el paquete `claude-swap`. aswap usa el paquete con el que se instaló.
- **Ajuste de historial anterior.** Las versiones anteriores de aswap guardaban la decisión de mantener un historial por cuenta en `session.shareHistory`. El `cswap` original solo lee `run.shareHistory` y comparte el historial por defecto, así que esa decisión se perdería y los historiales se fusionarían. aswap sigue respetando la clave anterior.

## Cómo se construye

`upstream.json` fija un commit de upstream. `bun run setup` clona ese commit sin cambios en `cswap/`. Después aplica cada parche de `patches/` con `git am`, en el orden indicado en [patches/.patches](../../patches/.patches). Sigue [la estructura que usa Electron para sus parches de Chromium y Node](https://github.com/electron/electron/tree/main/patches). Cada diff se mantiene pequeño y legible, y pasar a una versión más reciente de upstream consiste en hacer rebase de la serie.

| Parche                                                                                                                                        | Cambio                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [Seguir al propietario de la credencial activa](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | Corrección: configuración de cuenta obsoleta |
| [Seguir la distribución instalada](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                 | Corrección: versión y actualización          |
| [Actualizar el uso bajo demanda](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)                 | Función: `cswap refresh`                     |
| [Abrir Claude Desktop por cuenta](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)                    | Función: `cswap desktop`                     |
| [Abrir Chrome por cuenta](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)                            | Función: `cswap chrome`                      |
| [Conservar la elección anterior sobre el historial](../../patches/fix_keep_the_share_history_choice_an_earlier_aswap_release_stored.patch)    | Corrección: ajuste de historial anterior     |

Cada parche es un único commit, y su mensaje explica el problema en upstream. Para compilar desde el código fuente o trabajar en los parches, consulta [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Licencia

MIT, igual que claude-swap. Consulta [LICENSE](../../LICENSE).
