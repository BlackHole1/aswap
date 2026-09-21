#!/usr/bin/env bun
/**
 * aswap patch manager.
 *
 * Keeps the `patches/` series (one `git am`-able file per commit, ordered by
 * `patches/.patches`) applied on top of the upstream checkout in `cswap/`
 * (cloned at the commit pinned in `upstream.json`, git-ignored), the way
 * electron manages its patches over node/chromium.
 *
 *   bun run patches apply    clone cswap/ if needed, reset it to the pinned base and apply the series
 *   bun run patches export   regenerate patch files from the commits on top of the base
 *   bun run patches status   show base, applied commits, and whether an export is pending
 *   bun run patches verify   apply the series in a throwaway worktree (CI)
 *   bun run patches update   move the pin in upstream.json to a newer upstream commit and re-apply
 *
 * Invariants the export step honors:
 *   - a patch file is rewritten only when its diff or message changed;
 *     differences confined to `index <blob>..<blob>` lines are ignored, so
 *     adding, removing, or reordering patches never touches the others
 *   - files present in `patches/` but absent from `.patches` are left alone
 *     (a disabled patch); delete the file yourself to remove it for good
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const SUBMODULE = "cswap";
const SUB = path.join(ROOT, SUBMODULE);
const UPSTREAM_FILE = path.join(ROOT, "upstream.json");
const PATCHES = path.join(ROOT, "patches");
const INDEX = path.join(PATCHES, ".patches");
const BRANCH = "aswap/patched";
const UPSTREAM_REF = "origin/main";

// ---------------------------------------------------------------- helpers

interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

function run(args: string[], cwd: string): Run {
  const p = Bun.spawnSync(args, { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env } });
  return {
    code: p.exitCode,
    stdout: new TextDecoder().decode(p.stdout),
    stderr: new TextDecoder().decode(p.stderr),
  };
}

function git(args: string[], cwd = SUB): string {
  const r = run(["git", ...args], cwd);
  if (r.code !== 0) {
    throw new Error(`git ${args.join(" ")} (in ${path.relative(ROOT, cwd) || "."}) failed:\n${r.stderr || r.stdout}`);
  }
  return r.stdout.trimEnd();
}

function gitTry(args: string[], cwd = SUB): Run {
  return run(["git", ...args], cwd);
}

/** `git am` needs a committer; CI runners have none configured. The patch's
 *  author is preserved either way, so a placeholder committer is harmless. */
let committerArgs: string[] = [];
function ensureCommitterIdentity(): void {
  const has = (key: string) => gitTry(["config", key], ROOT).stdout.trim().length > 0;
  const name = process.env.GIT_COMMITTER_NAME || (has("user.name") ? "" : "aswap patches");
  const email = process.env.GIT_COMMITTER_EMAIL || (has("user.email") ? "" : "patches@aswap.invalid");
  if (name) committerArgs.push("-c", `user.name=${name}`);
  if (email) committerArgs.push("-c", `user.email=${email}`);
}

function gitAm(file: string, cwd = SUB): Run {
  return gitTry([...committerArgs, "am", "--3way", "--keep-non-patch", file], cwd);
}

function fail(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function info(msg: string): void {
  console.log(msg);
}

function short(sha: string): string {
  return sha.slice(0, 10);
}

interface Upstream {
  url: string;
  commit: string;
}

/** `upstream.json` pins the upstream commit the series is based on. The
 *  checkout itself (cswap/) is git-ignored, so nothing in it can be staged by
 *  mistake; only `update` rewrites the pin. */
function readUpstream(): Upstream {
  let u: Upstream;
  try {
    u = JSON.parse(readFileSync(UPSTREAM_FILE, "utf8")) as Upstream;
  } catch (e) {
    return fail(`cannot read upstream.json: ${(e as Error).message}`);
  }
  if (!/^[0-9a-f]{40}$/.test(u.commit ?? "")) fail(`upstream.json: "commit" must be a full 40-hex sha`);
  if (!/^https?:\/\//.test(u.url ?? "")) fail(`upstream.json: "url" must be an http(s) clone URL`);
  return u;
}

function baseSha(): string {
  return readUpstream().commit;
}

function writeUpstream(u: Upstream): void {
  writeFileSync(UPSTREAM_FILE, `${JSON.stringify(u, null, 2)}\n`);
}

function ensureSubmodule(): void {
  const { url } = readUpstream();
  if (!existsSync(path.join(SUB, ".git"))) {
    info(`cloning ${url} into ${SUBMODULE}/...`);
    git(["clone", "-q", url, SUBMODULE], ROOT);
  }
}

function ensureBaseFetched(base: string): void {
  if (gitTry(["cat-file", "-e", `${base}^{commit}`]).code !== 0) {
    info(`fetching upstream (base ${short(base)} not present locally)...`);
    git(["fetch", "-q", "origin"]);
    if (gitTry(["cat-file", "-e", `${base}^{commit}`]).code !== 0) {
      fail(`base commit ${base} is not reachable from origin`);
    }
  }
}

function amInProgress(): boolean {
  const dir = git(["rev-parse", "--git-path", "rebase-apply"]);
  return existsSync(path.isAbsolute(dir) ? dir : path.join(SUB, dir));
}

function isDirty(): boolean {
  return git(["status", "--porcelain", "--untracked-files=no"]).length > 0;
}

function readIndex(): string[] {
  if (!existsSync(INDEX)) return [];
  return readFileSync(INDEX, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function patchFileName(subject: string): string {
  const slug = subject
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100)
    .replace(/_+$/g, "");
  return `${slug || "patch"}.patch`;
}

const INDEX_LINE = /^index [0-9a-f]+\.\.[0-9a-f]+( \d{6})?$/gm;

/** Patch text with the blob ids removed, for change detection: two files
 *  that differ only there carry the same diff and the same message. */
function comparable(text: string): string {
  return text.replace(INDEX_LINE, "index <blob>..<blob>");
}

function formatPatch(sha: string): string {
  return (
    git([
      "format-patch",
      "-1",
      "--stdout",
      "--no-signature",
      "--keep-subject",
      "--zero-commit",
      "--no-stat",
      "--full-index",
      "--no-numbered",
      sha,
    ]) + "\n"
  );
}

interface Exported {
  sha: string;
  subject: string;
  name: string;
  text: string;
}

function collectSeries(base: string): Exported[] {
  const list = git(["rev-list", "--reverse", `${base}..HEAD`]);
  const shas = list ? list.split("\n") : [];
  const used = new Set<string>();
  return shas.map((sha) => {
    const subject = git(["log", "-1", "--format=%s", sha]);
    let name = patchFileName(subject);
    if (used.has(name)) {
      const stem = name.replace(/\.patch$/, "");
      let n = 2;
      while (used.has(`${stem}-${n}.patch`)) n++;
      name = `${stem}-${n}.patch`;
    }
    used.add(name);
    return { sha, subject, name, text: formatPatch(sha) };
  });
}

function resolutionHint(name: string): string {
  return [
    ``,
    `patch did not apply cleanly: ${name}`,
    `resolve it inside ${SUBMODULE}/, then continue the series:`,
    `  1. fix the conflicts (git -C ${SUBMODULE} status shows them)`,
    `  2. git -C ${SUBMODULE} add -A && git -C ${SUBMODULE} am --continue`,
    `  3. bun run patches apply --continue   (applies the remaining patches)`,
    `  4. bun run patches export             (rewrites the patches that changed)`,
    `or abandon:  git -C ${SUBMODULE} am --abort && bun run patches apply`,
  ].join("\n");
}

// --------------------------------------------------------------- commands

function applySeries(names: string[], startAt = 0): void {
  for (let i = startAt; i < names.length; i++) {
    const name = names[i];
    const file = path.join(PATCHES, name);
    if (!existsSync(file)) fail(`${name} is listed in .patches but missing from patches/`);
    const r = gitAm(file);
    if (r.code !== 0) {
      console.error((r.stdout + r.stderr).trim());
      console.error(resolutionHint(name));
      process.exit(1);
    }
    info(`  applied  ${name}`);
  }
}

function cmdApply(args: string[]): void {
  const force = args.includes("--force");
  const cont = args.includes("--continue");
  ensureSubmodule();
  const base = baseSha();
  const names = readIndex();

  if (cont) {
    if (amInProgress()) fail(`a git am is still in progress in ${SUBMODULE}/ (finish it with am --continue first)`);
    // Figure out how many of the series already sit on top of the base.
    const applied = collectSeries(base).map((e) => e.name);
    let next = 0;
    while (next < names.length && next < applied.length && applied[next] === names[next]) next++;
    if (next < applied.length) {
      fail(
        `commits on top of the base do not follow .patches (first mismatch at ${applied[next]}); run apply without --continue`,
      );
    }
    info(`continuing after ${next}/${names.length} patches`);
    applySeries(names, next);
    git(["checkout", "-q", "-B", BRANCH]);
    info(`done: ${names.length} patches on ${short(base)} (${BRANCH})`);
    return;
  }

  if (amInProgress())
    fail(`a git am is in progress in ${SUBMODULE}/; finish it (am --continue) or abort it (am --abort) first`);
  if (isDirty() && !force)
    fail(`${SUBMODULE}/ has uncommitted changes; commit or stash them, or pass --force to discard`);
  ensureBaseFetched(base);

  git(["checkout", "-q", "--force", "--detach", base]);
  if (force) git(["reset", "-q", "--hard"]);
  info(`base ${short(base)}: applying ${names.length} patches`);
  applySeries(names);
  git(["checkout", "-q", "-B", BRANCH]);
  info(`done: ${names.length} patches on ${short(base)} (${BRANCH})`);
}

interface ExportPlan {
  series: Exported[];
  writes: Exported[];
  unchanged: Exported[];
  indexChanged: boolean;
  orphans: string[];
}

function planExport(): ExportPlan {
  ensureSubmodule();
  if (amInProgress()) fail(`a git am is in progress in ${SUBMODULE}/; finish or abort it before exporting`);
  const base = baseSha();
  const series = collectSeries(base);
  const writes: Exported[] = [];
  const unchanged: Exported[] = [];
  for (const e of series) {
    const file = path.join(PATCHES, e.name);
    if (existsSync(file) && comparable(readFileSync(file, "utf8")) === comparable(e.text)) {
      unchanged.push(e);
    } else {
      writes.push(e);
    }
  }
  const names = series.map((e) => e.name);
  const indexChanged = JSON.stringify(readIndex()) !== JSON.stringify(names);
  const onDisk = existsSync(PATCHES) ? readdirSync(PATCHES).filter((f) => f.endsWith(".patch")) : [];
  const orphans = onDisk.filter((f) => !names.includes(f)).sort();
  return { series, writes, unchanged, indexChanged, orphans };
}

function cmdExport(args: string[]): void {
  const check = args.includes("--check");
  const plan = planExport();
  if (check) {
    for (const e of plan.writes) info(`  would write  ${e.name}`);
    if (plan.indexChanged) info(`  would write  .patches`);
    const pending = plan.writes.length > 0 || plan.indexChanged;
    info(pending ? "export pending" : "patches are up to date");
    process.exit(pending ? 1 : 0);
  }
  mkdirSync(PATCHES, { recursive: true });
  for (const e of plan.writes) {
    writeFileSync(path.join(PATCHES, e.name), e.text);
    info(`  wrote      ${e.name}`);
  }
  for (const e of plan.unchanged) info(`  unchanged  ${e.name}`);
  if (plan.indexChanged) {
    writeFileSync(INDEX, plan.series.map((e) => e.name).join("\n") + (plan.series.length ? "\n" : ""));
    info(`  wrote      .patches`);
  }
  for (const o of plan.orphans) info(`  not listed ${o}  (disabled; delete the file to drop it)`);
  info(`exported ${plan.series.length} patches (${plan.writes.length} written)`);
}

function cmdStatus(): void {
  ensureSubmodule();
  const base = baseSha();
  const head = git(["rev-parse", "HEAD"]);
  const branch = gitTry(["symbolic-ref", "--short", "-q", "HEAD"]).stdout.trim() || "(detached)";
  info(`upstream   ${readUpstream().url} (pinned in upstream.json)`);
  info(`base       ${base}`);
  info(`HEAD       ${head}  ${branch}`);
  info(`dirty      ${isDirty() ? "yes" : "no"}`);
  info(`git am     ${amInProgress() ? "IN PROGRESS" : "idle"}`);
  const names = readIndex();
  info(`\n.patches (${names.length}):`);
  for (const n of names) info(`  ${existsSync(path.join(PATCHES, n)) ? " " : "?"} ${n}`);
  if (amInProgress()) return;
  const series = collectSeries(base);
  info(`\ncommits on top of base (${series.length}):`);
  for (const e of series) info(`  ${short(e.sha)}  ${e.name}`);
  const plan = planExport();
  const pending = plan.writes.length > 0 || plan.indexChanged;
  info(`\nexport     ${pending ? "PENDING (run: bun run patches export)" : "up to date"}`);
  for (const o of plan.orphans) info(`  not listed ${o}`);
}

function cmdVerify(): void {
  ensureSubmodule();
  const base = baseSha();
  ensureBaseFetched(base);
  const names = readIndex();
  const wt = path.join(ROOT, ".patches-verify");
  gitTry(["worktree", "remove", "--force", wt]);
  git(["worktree", "add", "--detach", "-q", wt, base]);
  let ok = true;
  try {
    for (const name of names) {
      const file = path.join(PATCHES, name);
      if (!existsSync(file)) fail(`${name} is listed in .patches but missing from patches/`);
      const r = gitAm(file, wt);
      if (r.code !== 0) {
        console.error((r.stdout + r.stderr).trim());
        console.error(`FAIL  ${name}`);
        gitTry(["am", "--abort"], wt);
        ok = false;
        break;
      }
      info(`  ok  ${name}`);
    }
  } finally {
    git(["worktree", "remove", "--force", wt]);
    gitTry(["worktree", "prune"]);
  }
  if (!ok) process.exit(1);
  info(`verified: ${names.length} patches apply cleanly on ${short(base)}`);
}

function cmdUpdate(args: string[]): void {
  const ref = args.find((a) => !a.startsWith("--")) ?? UPSTREAM_REF;
  const force = args.includes("--force");
  ensureSubmodule();
  if (amInProgress()) fail(`a git am is in progress in ${SUBMODULE}/; finish or abort it first`);
  if (isDirty() && !force) fail(`${SUBMODULE}/ has uncommitted changes; commit or stash them first`);
  const plan = planExport();
  if ((plan.writes.length > 0 || plan.indexChanged) && !force) {
    fail(`patches/ is behind the commits in ${SUBMODULE}/; run "bun run patches export" first (or --force to ignore)`);
  }
  git(["fetch", "-q", "origin"]);
  const target = git(["rev-parse", "--verify", `${ref}^{commit}`]);
  const current = baseSha();
  if (target === current) {
    info(`base already at ${short(current)} (${ref})`);
  } else {
    info(`base ${short(current)} -> ${short(target)} (${ref})`);
  }
  git(["checkout", "-q", "--force", "--detach", target]);
  writeUpstream({ ...readUpstream(), commit: target });
  const names = readIndex();
  info(`applying ${names.length} patches on the new base`);
  applySeries(names);
  git(["checkout", "-q", "-B", BRANCH]);
  cmdExport([]);
  info(`\nupdated; review "git diff" and commit upstream.json together with any rewritten patches`);
}

function cmdHelp(): void {
  console.log(`usage: bun run patches <command>

  apply [--force] [--continue]   clone ${SUBMODULE}/ if missing, reset it to the pinned base, apply patches/.patches in order
                                 --force discards uncommitted changes in ${SUBMODULE}/
                                 --continue resumes after a resolved conflict
  export [--check]               write patches/ from the commits on top of the base
                                 (only files whose diff or message changed; --check just reports)
  status                         base, HEAD, index, pending export
  verify                         apply the series in a throwaway worktree (exit 1 on failure)
  update [ref] [--force]         fetch upstream, pin <ref> (default ${UPSTREAM_REF}) in upstream.json,
                                 re-apply and export
  help                           this text`);
}

const [cmd = "help", ...rest] = process.argv.slice(2);
ensureCommitterIdentity();
switch (cmd) {
  case "apply":
    cmdApply(rest);
    break;
  case "export":
    cmdExport(rest);
    break;
  case "status":
    cmdStatus();
    break;
  case "verify":
    cmdVerify();
    break;
  case "update":
    cmdUpdate(rest);
    break;
  case "help":
  case "--help":
  case "-h":
    cmdHelp();
    break;
  default:
    fail(`unknown command "${cmd}" (see: bun run patches help)`);
}
