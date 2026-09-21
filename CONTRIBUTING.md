# Contributing

aswap is upstream [claude-swap](https://github.com/realiti4/claude-swap) as a git submodule plus a patch series. Contributions are patches: one commit on top of the upstream base, exported as a file under `patches/`.

## Layout

```
cswap/                   upstream claude-swap (git submodule, never edited on its base commit)
patches/.patches         ordered list of the patch files to apply
patches/*.patch          one commit each, named after the commit title
scripts/patches.ts       the patch manager (bun)
scripts/build.ts         builds both wheels into dist/; scripts/install.ts installs them with uv tool
packaging/aswap/         the aswap wrapper package (command aswap, link/unlink) and the PyPI README
.codex/skills/patches/   the workflow for AI agents; .claude/skills links to it
docs/readme/             the README in other languages
```

## Setup

Requirements: git, [bun](https://bun.sh) (version pinned in `.bun-version`), [uv](https://docs.astral.sh/uv/).

```bash
git clone --recurse-submodules https://github.com/BlackHole1/aswap
cd aswap
bun install              # oxlint, oxfmt, typescript for the scripts
bun run setup            # init the submodule and apply the series
bun run test             # upstream's test suite on the patched tree
```

After `setup`, `cswap/` sits on branch `aswap/patched` with every listed patch applied.

## Commands

| command                          | effect                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run patches apply`          | check out the base commit in `cswap/` and apply the series (`--force` discards local changes, `--continue` resumes after a resolved conflict) |
| `bun run patches export`         | regenerate `patches/` from the commits on top of the base (`--check` only reports)                                                            |
| `bun run patches status`         | base, HEAD, index, disabled files, pending export                                                                                             |
| `bun run patches verify`         | apply the series in a throwaway worktree; fails if any patch does not apply                                                                   |
| `bun run patches update [ref]`   | fetch upstream, move the base to `ref` (default `origin/main`), re-apply, export                                                              |
| `bun run test`                   | `uv run pytest` inside `cswap/`                                                                                                               |
| `bun run build`                  | build the patched claude-swap wheel and the aswap wheel into `dist/` (refuses when `cswap/` does not match `patches/`)                        |
| `bun run install:cswap`          | build, then `uv tool install` the patched claude-swap in place of the PyPI package (command `cswap`)                                          |
| `bun run install:aswap`          | build, then `uv tool install` the `aswap` package next to upstream cswap (command `aswap`; source in `packaging/aswap`)                       |
| `bun run install:all`            | both                                                                                                                                          |
| `bun run lint`, `bun run format` | oxlint and oxfmt checks for the scripts (`bun run fix` applies both)                                                                          |
| `bun run typecheck`              | `tsc --noEmit` for the scripts                                                                                                                |

## Working with patches

The complete workflow, including conflict resolution and upstream updates, is in [.codex/skills/patches/SKILL.md](.codex/skills/patches/SKILL.md); it is written for AI agents but applies to people just the same. The short version:

- **Add.** Edit inside `cswap/`, add tests, commit with a Conventional Commits title in English, then `bun run patches export`. The file name is derived from the title.
- **Modify.** Never edit a `.patch` file. Amend the commit (`git commit --fixup` plus `rebase --autosquash` onto the base), then export.
- **Disable.** Delete its line from `patches/.patches` and run `apply`. The file stays and is reported as `not listed`.
- **Remove.** Disable it, then delete the file.
- **Insert or reorder.** Reorder the commits in `cswap/`, then export.
- **Update upstream.** `bun run patches update`; resolve conflicts as `apply` describes, then commit the new submodule pointer together with any rewritten patches.

`export` rewrites a patch file only when its diff or message changed. Differences limited to `index <blob>..<blob>` lines are ignored, so adding, removing, disabling or reordering patches never touches the other files. The one exception is a conflict: a patch that had to be adjusted to apply is, by definition, a changed patch.

## Versioning and releases

`package.json` holds the aswap version; `bun run build` stamps it into the aswap wheel (the wheel's pyproject is generated from cswap's at build time, see `scripts/build.ts`). The patched claude-swap wheel keeps upstream's version.

To release:

```bash
# bump "version" in package.json, commit, then
gh release create v0.2.0 --generate-notes
```

The tag triggers `.github/workflows/publish.yml`: it applies the series, builds both wheels, publishes `aswap` to PyPI through trusted publishing (PyPI project `aswap`, GitHub environment `pypi`), and attaches the wheels to the release. The tag must equal `v` plus the package.json version or the workflow stops.

## The aswap wrapper

`packaging/aswap/src/aswap/cli.py` is the `aswap` entry point: it handles `aswap link` / `aswap unlink` (a `cswap` launcher next to `aswap`) and hands everything else to `claude_swap.cli.main`. Behavior that belongs to cswap itself goes into a patch, not into the wrapper.

## Patch quality

- One logical change per patch, with tests inside the same commit. Upstream's suite must stay green (`bun run test`).
- The commit message is the patch's documentation: describe the upstream problem, the measured symptom, and the approach. Keep the title short; it becomes the file name.
- Prefer changes that could be sent upstream. If you do send one, note the pull request in the commit body so the patch can be dropped once it lands.

## Before opening a pull request

```bash
bun run fix
bun run typecheck
bun run patches export --check
bun run patches verify
bun run test
```

`git status` should show only `patches/` (plus the `cswap` pointer after an `update`).

## Contribution license

By submitting a pull request you agree that your contribution is provided under the MIT License, the same license as claude-swap.
