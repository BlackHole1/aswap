---
name: patches
description: Manage the aswap patch series applied on top of the cswap (claude-swap) checkout pinned in upstream.json. Use whenever you change anything under cswap/ or patches/, need to add, modify, reorder, disable or remove a patch, resolve a patch conflict, or move upstream.json to a newer upstream commit.
---

# aswap patches

`cswap/` is upstream [claude-swap](https://github.com/realiti4/claude-swap),
cloned by `apply` at the commit pinned in `upstream.json`; the directory itself
is git-ignored. Every local change is a commit on top of that base, stored as a
`git am` patch in `patches/`. `patches/.patches` lists the
patch files in apply order, one per line, like Electron's `patches/*/.patches`.
The tooling is `scripts/patches.ts` (bun), reachable as `bun run patches <cmd>`.

## Invariants

- Never edit `cswap/` on the base commit. The base is the `commit` in
  `upstream.json`; only `bun run patches update` rewrites it, and it must always
  be an upstream commit, never one of the patch commits.
- Never hand-edit `*.patch` files. Change the commit in `cswap/`, then export.
- `export` rewrites a patch file only when its diff or commit message changed.
  Differences confined to `index <blob>..<blob>` lines are ignored, so adding,
  removing, reordering or disabling patches leaves the other files byte-for-byte
  unchanged. A stale `index` line only matters when a patch stops applying
  cleanly, and that is a conflict anyway (see below).
- A file listed in `.patches` must exist in `patches/`. A file in `patches/`
  that is not listed is a disabled patch; `export` reports it as `not listed`
  and never deletes it.
- Patch file name = commit title, lower-cased, quotes stripped, every other run
  of non-alphanumerics replaced by `_`, `.patch` appended. The title follows
  Conventional Commits in English (`fix: ...`, `feat: ...`), so name the commit
  carefully: renaming a patch later means a new file.
- One logical change per patch. The commit body explains the upstream problem
  and the approach; it is the only documentation the patch gets.
- Keep upstream's test suite green: `bun run test` (runs `uv run pytest` in
  `cswap/`). New behavior gets tests inside the same patch.

## Commands

| command | effect |
| --- | --- |
| `bun run patches apply` | check out the base in `cswap/`, `git am --3way` every listed patch, leave HEAD on branch `aswap/patched` |
| `bun run patches apply --force` | same, discarding uncommitted changes and unexported commits in `cswap/` (without it, apply refuses both) |
| `bun run patches apply --continue` | after resolving a conflict and `git am --continue`, apply the rest of the series |
| `bun run patches export` | write `patches/*.patch` and `.patches` from the commits on top of the base |
| `bun run patches export --check` | report what export would write, exit 1 if anything (CI) |
| `bun run patches status` | base, HEAD, index, orphans, pending export |
| `bun run patches verify` | apply the series in a throwaway worktree, exit 1 on failure |
| `bun run patches update [ref]` | fetch upstream, pin `<ref>` (default `origin/main`) in `upstream.json`, re-apply, export |
| `bun run test` | upstream test suite on the patched tree |
| `bun run build` | claude-swap and aswap wheels into `dist/`; refuses when the tree and `patches/` disagree |
| `bun run install:cswap` / `install:aswap` / `install:all` | build, then `uv tool install` the patched cswap in place, the side-by-side `aswap` command, or both |

Base commit: the `commit` in `upstream.json`. Patched commits: `git -C cswap log <base>..HEAD`.

Releases: `gh workflow run publish.yml` (optionally `-f bump=minor|major` or `-f version=X.Y.Z`); the workflow computes the version from tags, publishes `aswap` to PyPI and creates the tag and release. No version lives in the tree. `packaging/aswap/src/aswap/cli.py` is the `aswap` wrapper (`link` / `unlink`); cswap behavior changes are patches, never wrapper code.

## Workflows

Start every workflow with `bun run patches status`. If it says `git am IN
PROGRESS`, finish or abort that first. If it says `export PENDING`, someone
committed in `cswap/` without exporting: run `bun run patches export` and
review the result before doing anything else.

### Add a patch (append)

1. `bun run patches apply` if `cswap/` is not already on `aswap/patched` at the
   full series.
2. Edit inside `cswap/`, add tests, run `bun run test`.
3. Commit in `cswap/` with a Conventional Commits title in English and a body
   that explains the upstream problem (`git -C cswap commit`).
4. `bun run patches export`. Expect one `wrote <new>.patch`, one `wrote
   .patches`, every other patch `unchanged`.
5. `bun run patches verify`, then commit `patches/` in the superproject.

### Modify an existing patch

Do not edit the `.patch` file. Amend the commit that produced it:

```bash
BASE=$(bun -e 'console.log(require("./upstream.json").commit)')
git -C cswap log --oneline $BASE..HEAD          # find the commit
# make the change in cswap/, then
git -C cswap add -A && git -C cswap commit --fixup <sha>
GIT_SEQUENCE_EDITOR=true git -C cswap rebase -i --autosquash $BASE
bun run patches export                          # only that patch is rewritten
```

If the rebase stops on a conflict, resolve it, `git -C cswap add -A`, then
`git -C cswap rebase --continue`; later patches that had to change are
rewritten by the export, which is the one case where other patch files
legitimately change.

Keep the commit title unless you want the file renamed. A renamed patch leaves
the old file behind as `not listed`: delete it.

### Insert a patch in the middle or reorder

Commit the new change on top, then rebuild the branch around it with
cherry-picks:

```bash
NEW=$(git -C cswap rev-parse HEAD)          # the change to insert
TIP=$(git -C cswap rev-parse HEAD~1)        # the rest of the series
git -C cswap reset --hard <sha-to-insert-after>
git -C cswap cherry-pick $NEW
git -C cswap cherry-pick <sha-to-insert-after>..$TIP
bun run patches export        # .patches is rewritten in the new order; unchanged diffs stay untouched
```

On a conflict, resolve it, `git -C cswap add -A`, `git -C cswap cherry-pick
--continue`, and run the remaining `cherry-pick` if it was the first one.

Reordering `.patches` by hand and running `apply` is also valid when the
patches are independent; then `export` only rewrites `.patches`.

### Disable a patch (keep the file)

1. Delete its line from `patches/.patches`.
2. `bun run patches apply` (re-applies the remaining series).
3. `bun run patches export --check` should report nothing to write; `status`
   lists the file as `not listed`.

### Remove a patch for good

Disable it as above, then `git rm patches/<file>.patch`.

### Resolve a conflict during apply

`apply` stops at the first patch that does not apply and leaves `git am` in
progress inside `cswap/`:

1. `git -C cswap status` shows the conflicted files; fix them in place.
2. `git -C cswap add -A && git -C cswap am --continue`.
3. `bun run patches apply --continue` applies the rest of the series (repeat
   from step 1 if another one conflicts).
4. `bun run patches export`. The patches whose diff had to change are
   rewritten; everything else stays `unchanged`.
5. `bun run test`, `bun run patches verify`, commit.

To give up: `git -C cswap am --abort && bun run patches apply`.

### Update upstream

```bash
bun run patches update              # origin/main
bun run patches update v0.28.0      # a tag or any commit reachable from origin
```

`update` refuses to run while `cswap/` has uncommitted changes or while
`patches/` is behind the commits in `cswap/`. On success it writes the new
commit to `upstream.json` and re-exports; commit that file and any rewritten
patches together. On a conflict it stops exactly like `apply` does; resolve,
`--continue`, `export`, and `upstream.json` already carries the new base.

### Before you finish

- `bun run patches export --check` reports nothing to write.
- `bun run patches verify` passes.
- `bun run test` passes.
- `git status` in the superproject shows only `patches/` changes (plus
  `upstream.json` after an `update`).
- To try the change on this machine, `bun run install:all`, never
  `install:cswap` alone: the `aswap` wheel bundles its own copy of the cswap
  code, so an installed `aswap` stays on the old build otherwise.
