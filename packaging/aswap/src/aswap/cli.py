"""Entry point for ``aswap``.

Everything is claude-swap's own CLI except two commands of ours:

    aswap link      make ``cswap`` run this install (a ``cswap`` launcher next to ``aswap``)
    aswap unlink    remove that launcher again

Installers (uv tool, pipx) install every entry point a package declares and
cannot skip one, so shipping a ``cswap`` entry point would collide with an
installed upstream claude-swap. A launcher the user creates on purpose keeps
both choices open: side by side by default, replacement on request.
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

WINDOWS = sys.platform == "win32"
LAUNCHER = "cswap.exe" if WINDOWS else "cswap"

USAGE = """usage: aswap link [--force]
       aswap unlink [--force]
       aswap link --status

Create (or remove) a `cswap` launcher next to the `aswap` command, so `cswap`
runs this install instead of upstream claude-swap.

  --status   show what `cswap` currently resolves to
  --force    replace (or remove) a `cswap` that aswap did not create
"""


def _own_launcher() -> Path:
    """The ``aswap`` launcher the user ran, resolved through PATH when it was
    typed bare."""
    argv0 = Path(sys.argv[0] or "")
    if argv0.parent != Path(".") and argv0.exists():
        return argv0.absolute()
    found = shutil.which("aswap")
    if found:
        return Path(found).absolute()
    return argv0.absolute()


def _links_to(target: Path, launcher: Path) -> bool:
    """Whether ``target`` is a launcher aswap created for ``launcher``."""
    try:
        if target.is_symlink():
            return target.resolve() == launcher.resolve()
        if WINDOWS and target.is_file() and launcher.is_file():
            return target.read_bytes() == launcher.read_bytes()
    except OSError:
        pass
    return False


def _status(target: Path, launcher: Path) -> int:
    on_path = shutil.which("cswap")
    if not target.exists() and not target.is_symlink():
        print(f"cswap: not linked (would be created at {target})")
    elif _links_to(target, launcher):
        print(f"cswap -> {launcher}  (linked by aswap)")
    else:
        print(f"cswap at {target} is not aswap's (upstream claude-swap or another tool)")
    if on_path and Path(on_path).absolute() != target:
        print(f"note: `cswap` on PATH resolves to {on_path} first")
    return 0


def _link(force: bool) -> int:
    launcher = _own_launcher()
    if not launcher.exists():
        print(f"error: cannot locate the aswap launcher (looked at {launcher})", file=sys.stderr)
        return 1
    target = launcher.parent / LAUNCHER
    if _links_to(target, launcher):
        print(f"cswap already runs aswap ({target})")
        return 0
    if target.exists() or target.is_symlink():
        if not force:
            print(
                f"error: {target} exists and is not aswap's.\n"
                "If it is upstream claude-swap, remove it first (uv tool uninstall claude-swap "
                "or pipx uninstall claude-swap), or pass --force to replace it.",
                file=sys.stderr,
            )
            return 1
        target.unlink()
    if WINDOWS:
        shutil.copy2(launcher, target)
    else:
        os.symlink(launcher.name, target)
    print(f"linked: {target} -> {launcher.name}")
    other = shutil.which("cswap")
    if other and Path(other).absolute() != target:
        print(f"note: `cswap` on PATH still resolves to {other} first; remove it or reorder PATH")
    return 0


def _unlink(force: bool) -> int:
    launcher = _own_launcher()
    target = launcher.parent / LAUNCHER
    if not target.exists() and not target.is_symlink():
        print("cswap is not linked")
        return 0
    if not _links_to(target, launcher) and not force:
        print(f"error: {target} was not created by aswap; pass --force to remove it anyway", file=sys.stderr)
        return 1
    target.unlink()
    print(f"unlinked: {target}")
    return 0


def main(argv: list[str] | None = None) -> int | None:
    args = list(sys.argv[1:] if argv is None else argv)
    if args and args[0] in ("link", "unlink"):
        flags = args[1:]
        unknown = [a for a in flags if a not in ("--force", "--status", "-h", "--help")]
        if unknown or "-h" in flags or "--help" in flags:
            print(USAGE, end="", file=sys.stderr if unknown else sys.stdout)
            return 2 if unknown else 0
        launcher = _own_launcher()
        if "--status" in flags:
            return _status(launcher.parent / LAUNCHER, launcher)
        return (_link if args[0] == "link" else _unlink)("--force" in flags)
    from claude_swap.cli import main as cswap_main

    return cswap_main()
