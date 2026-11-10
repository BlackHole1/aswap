<div align="center">

# aswap

[English](../../README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | 한국어 | [Русский](README.ru.md) | [Français](README.fr.md) | [Español](README.es.md)

<img src="../images/cswap-list.png" alt="cswap list: two accounts with their 5h, 7d and per-model usage, then cswap switch 2" width="820">

[claude-swap](https://github.com/realiti4/claude-swap)으로 Claude Code 계정을 전환합니다. 여기에 꾸준히 관리되는 수정 사항과 기능을 더했습니다.

</div>

`cswap`은 여러 Claude 계정을 관리합니다. 계정별 사용량을 추적하고, 남은 할당량이 가장 많은 계정으로 전환할 수 있습니다. aswap은 수정하지 않은 업스트림 소스로 `cswap`을 빌드하고, 그 위에 소수의 패치를 적용합니다. 모든 `cswap` 명령은 기존과 똑같이 동작합니다.

이름은 **account swap**의 줄임말입니다.

## 설치

```bash
uv tool install aswap  # 또는: pipx install aswap
aswap --version
```

`aswap`은 모든 `cswap` 명령을 받습니다. 업스트림 `cswap`과 나란히 설치되며, 기존 설치는 건드리지 않습니다.

aswap을 `cswap` 이름으로도 실행하려면 다음과 같이 합니다.

```bash
aswap link    # aswap 옆에 cswap 런처 추가
aswap unlink  # 런처 제거
```

`aswap link`는 aswap 설치가 만든 `cswap` 런처만 교체합니다. 업스트림 `cswap`을 교체하려면 먼저 제거(`uv tool uninstall claude-swap`)하거나 `--force`를 지정하세요.

업그레이드하려면 `aswap upgrade`를 실행합니다. aswap을 설치한 방식에 따라 `uv tool upgrade` 또는 `pipx upgrade`를 호출합니다.

## aswap이 추가하는 기능

### 필요할 때 사용량 새로고침

`cswap refresh [account ...]`는 사용량을 즉시 가져오며, 계정을 하나씩 처리합니다. 사용량 제한에 걸린 계정은 서버가 다음 재시도를 허용하는 시각을 표시합니다.

<img src="../images/cswap-refresh.png" alt="cswap refresh: one account refreshed, the other rate limited with the server retry time" width="820">

### 계정별 Claude Desktop 창

Claude Desktop은 한 번에 하나의 로그인만 유지합니다. `cswap desktop 2`는 계정 2를 자체 로그인을 가진 별도 창으로 열고, `cswap desktop --all`은 모든 계정을 엽니다. 각 창의 Code 탭에는 같은 로컬 세션이 표시됩니다(Windows 제외). 이 방식은 [guise](https://github.com/siddhjagani/guise)를 따릅니다.

<img src="../images/cswap-desktop.png" alt="cswap desktop --all opening one Claude Desktop window per account, then cswap desktop listing both as open" width="820">

### 계정별 Chrome 프로필

Claude in Chrome은 `cswap switch`로 선택한 계정이 아니라 브라우저의 claude.ai 로그인을 사용합니다([업스트림 #256](https://github.com/realiti4/claude-swap/issues/256)). `cswap chrome 2`는 Chrome 프로필의 별도 사본에서 계정 2를 엽니다. 그 안의 확장 프로그램은 계정 2로 동작하고, 기본 브라우저는 기존 로그인을 그대로 유지합니다.

<img src="../images/cswap-chrome.png" alt="cswap chrome 2 opening a copy of the stock Chrome profile for account 2, cswap chrome 1 opening account 1, then cswap chrome listing both as open" width="820">

- `cswap chrome --sync 2`는 현재 Chrome 프로필을 계정 2에 다시 복사합니다. 먼저 해당 창을 닫으세요.
- `cswap config set chrome.followSwitch true`를 설정하면 `cswap switch` 시 해당 계정의 브라우저를 앞으로 가져옵니다.
- `cswap config set chrome.appPath <path>`로 Edge나 Brave 같은 다른 Chromium 브라우저를 사용할 수 있습니다.

### 버그 수정

- **오래된 계정 설정.** `~/.claude.json`이 여전히 계정 B를 가리키는데 키체인에는 계정 A의 토큰이 있으면, 업스트림은 A에 다시 로그인하라고 요청하고 B의 갱신을 멈춥니다. aswap은 현재 사용 중인 토큰을 소유한 계정을 따릅니다.
- **버전과 업그레이드.** `--version`, 업데이트 확인, `upgrade`는 `claude-swap` 패키지에 하드코딩되어 있습니다. aswap은 자신이 설치된 패키지를 사용합니다.

## 빌드 방식

`upstream.json`은 업스트림 커밋 하나를 고정합니다. `bun run setup`은 해당 커밋을 수정 없이 `cswap/`에 클론한 뒤, `patches/`의 모든 패치를 [patches/.patches](../../patches/.patches)에 나열된 순서대로 `git am`으로 적용합니다. 이는 [Electron이 Chromium과 Node 패치에 사용하는 구조](https://github.com/electron/electron/tree/main/patches)를 따릅니다. 각 diff는 작고 읽기 쉽게 유지되며, 새 업스트림으로 옮기는 작업은 패치 시리즈를 리베이스하는 것으로 끝납니다.

| 패치                                                                                                                           | 변경 내용               |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| [현재 자격 증명의 소유자 따르기](../../patches/fix_follow_the_live_credentials_owner_when_the_config_names_another_slot.patch) | 수정: 오래된 계정 설정  |
| [설치된 배포 패키지 따르기](../../patches/feat_report_check_and_upgrade_the_distribution_this_install_came_from.patch)         | 수정: 버전과 업그레이드 |
| [필요할 때 사용량 새로고침](../../patches/feat_add_a_refresh_command_that_fetches_usage_now_one_account_at_a_time.patch)       | 기능: `cswap refresh`   |
| [계정별 Claude Desktop 열기](../../patches/feat_open_claude_desktop_as_a_stored_account_one_window_per_account.patch)          | 기능: `cswap desktop`   |
| [계정별 Chrome 열기](../../patches/feat_open_chrome_as_a_stored_account_so_claude_in_chrome_follows_it.patch)                  | 기능: `cswap chrome`    |

각 패치는 단일 커밋이며, 커밋 메시지에 업스트림의 문제가 설명되어 있습니다. 소스에서 빌드하거나 패치 작업을 하려면 [CONTRIBUTING.md](../../CONTRIBUTING.md)를 참고하세요.

## 라이선스

claude-swap과 같은 MIT 라이선스입니다. [LICENSE](../../LICENSE)를 참고하세요.
