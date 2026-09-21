<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | 한국어 | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

Claude Code용 계정 전환 도구: [claude-swap](https://github.com/realiti4/claude-swap) (`cswap`)에 지속적으로 관리되는 수정 사항을 얹은 것입니다.

</div>

`cswap`은 여러 Claude 계정 사이를 전환하고, 각 계정의 사용량 창을 추적하며, 여유가 가장 많은 계정으로 옮겨 줍니다. aswap은 같은 도구를 제공합니다. 수정하지 않은 업스트림 소스로 빌드하고, 업스트림이 아직 고치지 않은 문제에 대한 작고 검토 가능한 패치 시리즈를 얹었습니다. 익숙한 `cswap` 명령 그대로, 거친 부분만 다듬은 상태로 받게 됩니다.

## 이름에 대해

aswap은 **account swap** (계정 전환)의 줄임말이며, 이 도구가 하는 일 그 자체입니다. `cswap` 옆에 놓고 보면 `a`는 이 프로젝트가 더하는 유일한 것이기도 합니다. aswap은 cswap에 패치 시리즈를 더한 것일 뿐, 그 이상은 아닙니다. 그리고 Claude Code가 범용 에이전트 런타임으로 자라남에 따라, `a`에는 그에 따라오는 계정들, 즉 AI 계정과 에이전트 계정을 위한 자리도 남아 있습니다.

## 설치

```bash
uv tool install aswap  # 또는: pipx install aswap
aswap --version
```

`aswap`은 `cswap`의 모든 사용법을 받아들이며, 업스트림 `cswap` 옆에 설치되고 그것을 건드리지 않습니다. `cswap`이라는 이름으로도 aswap을 실행하려면:

```bash
aswap link  # aswap 옆에 cswap 런처를 만듭니다. aswap unlink로 제거
```

`aswap link`는 자신이 만들지 않은 `cswap`을 덮어쓰지 않습니다. 먼저 업스트림을 제거하거나 (`uv tool uninstall claude-swap`) `--force`를 붙이세요.

## 업그레이드

```bash
aswap upgrade  # 설치 방식에 따라 uv tool upgrade aswap 또는 pipx upgrade aswap
```

소스에서 빌드하는 방법과 PyPI의 `cswap`을 패치된 빌드로 제자리에서 대체하는 방법은 [CONTRIBUTING.md](../../CONTRIBUTING.md)에 있습니다.

## 패치가 고치는 것

| 패치                                                                                                                                    | 문제                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [라이브 자격 증명의 실제 소유자를 따르기](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | 오래된 `~/.claude.json`이 계정 B를 가리키는데 키체인에는 계정 A의 토큰이 남아 있을 수 있습니다. 업스트림은 A를 잘못 "재로그인 필요"로 표시하고 B도 갱신하지 않습니다. 이 패치는 자격 증명의 실제 소유자를 따르고 그 답을 실행 간에 기억합니다. |
| [설치된 배포판을 따르기](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)                     | 버전, 업데이트 확인, `upgrade`가 `claude-swap`을 고정해 두어 `aswap`으로 설치하면 깨집니다. 이 패치는 실제로 코드를 제공하는 배포판을 따릅니다.                                                                                                |

각 패치는 커밋 하나이며 커밋 메시지가 업스트림 문제를 설명합니다. 전체 목록은 [patches/.patches](../../patches/.patches)에 있습니다.

## 만드는 방식

업스트림을 fork하지 않습니다. `cswap/`에 git submodule로 그대로 가져오고, 모든 변경은 일반적인 `git am` 패치로 `patches/`에 두며 `patches/.patches`에 나열된 순서대로 적용합니다. 이것은 [Electron이 Node와 Chromium 패치를 관리하는 방식](https://github.com/electron/electron/tree/main/patches)과 같습니다. 차이는 작고 읽기 쉽게 유지되며, 업스트림 업데이트는 merge가 아니라 패치 시리즈의 rebase가 됩니다. 세부 사항, 명령, 패치 워크플로는 [CONTRIBUTING.md](../../CONTRIBUTING.md)에 있습니다.

## 라이선스

claude-swap과 같은 MIT. [LICENSE](../../LICENSE) 참조.
