#!/usr/bin/env bun
/**
 * Build the installable artifacts under dist/:
 *
 *   claude_swap-<upstream version>-py3-none-any.whl   the patched upstream package (command: cswap),
 *                                                     a drop-in replacement for the PyPI release
 *   aswap-<version>-py3-none-any.whl                  the aswap distribution: the same patched
 *                                                     claude_swap module plus the aswap wrapper
 *                                                     (command: aswap), self-contained, publishable
 *
 * The aswap wheel is built from a staging tree: packaging/aswap (wrapper
 * package, README) plus cswap/src/claude_swap, with cswap's own pyproject
 * rewritten for the aswap name, version (package.json), scripts and urls.
 *
 * Install with `bun run install:cswap`, `bun run install:aswap` or `bun run install:all`.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const SUB = path.join(ROOT, "cswap");
const DIST = path.join(ROOT, "dist");
const STAGING = path.join(DIST, ".aswap-build");
const PACKAGING = path.join(ROOT, "packaging", "aswap");
const REPO_URL = "https://github.com/BlackHole1/aswap";

function run(args: string[], cwd = ROOT): number {
  const p = Bun.spawnSync(args, { cwd, stdout: "inherit", stderr: "inherit" });
  return p.exitCode;
}

function fail(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function replaceOnce(text: string, pattern: RegExp, replacement: string, what: string): string {
  if (!pattern.test(text)) fail(`cannot find ${what} in cswap/pyproject.toml (upstream layout changed?)`);
  return text.replace(pattern, replacement);
}

if (!existsSync(path.join(SUB, ".git"))) fail("cswap/ is not initialized; run: bun run setup");

// The tree must carry exactly the exported series: nothing unexported, nothing missing.
if (run(["bun", path.join(ROOT, "scripts", "patches.ts"), "export", "--check"]) !== 0) {
  fail("cswap/ does not match patches/; run `bun run patches apply` (or export your pending commits) first");
}
if (Bun.spawnSync(["git", "status", "--porcelain", "--untracked-files=no"], { cwd: SUB }).stdout.length > 0) {
  fail("cswap/ has uncommitted changes; commit them as a patch or discard them before building");
}

const version = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")).version as string;
const upstreamToml = readFileSync(path.join(SUB, "pyproject.toml"), "utf8");
const upstreamVersion = upstreamToml.match(/^version = "([^"]+)"$/m)?.[1] ?? "unknown";
const patchCount = readFileSync(path.join(ROOT, "patches", ".patches"), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#")).length;

rmSync(DIST, { recursive: true, force: true });

// 1. The patched upstream package, unchanged.
if (run(["uv", "build", SUB, "--out-dir", DIST]) !== 0) fail("uv build of claude-swap failed");

// 2. The aswap distribution from a staging tree.
mkdirSync(path.join(STAGING, "src"), { recursive: true });
cpSync(path.join(SUB, "src", "claude_swap"), path.join(STAGING, "src", "claude_swap"), { recursive: true });
cpSync(path.join(PACKAGING, "src", "aswap"), path.join(STAGING, "src", "aswap"), { recursive: true });
cpSync(path.join(PACKAGING, "README.md"), path.join(STAGING, "README.md"));
cpSync(path.join(ROOT, "LICENSE"), path.join(STAGING, "LICENSE"));
for (const dir of readdirSync(STAGING, { recursive: true, withFileTypes: true })) {
  if (dir.isDirectory() && dir.name === "__pycache__") rmSync(path.join(dir.parentPath, dir.name), { recursive: true });
}

let toml = upstreamToml;
toml = replaceOnce(toml, /^name = "claude-swap"$/m, `name = "aswap"`, "project name");
toml = replaceOnce(toml, /^version = "[^"]*"$/m, `version = "${version}"`, "version");
toml = replaceOnce(
  toml,
  /^description = "[^"]*"$/m,
  `description = "Account swap for Claude Code: claude-swap ${upstreamVersion} (cswap) with ${patchCount} maintained patches, as the aswap command"`,
  "description",
);
toml = replaceOnce(
  toml,
  /^\[project\.scripts\]\n(?:.+\n)+?\n/m,
  `[project.scripts]\naswap = "aswap.cli:main"\n\n`,
  "[project.scripts]",
);
toml = replaceOnce(
  toml,
  /^\[project\.urls\]\n(?:.+\n)+?\n/m,
  `[project.urls]\nHomepage = "${REPO_URL}"\nRepository = "${REPO_URL}"\nIssues = "${REPO_URL}/issues"\nUpstream = "https://github.com/realiti4/claude-swap"\n\n`,
  "[project.urls]",
);
toml = replaceOnce(
  toml,
  /^packages = \["src\/claude_swap"\]$/m,
  `packages = ["src/claude_swap", "src/aswap"]`,
  "wheel packages",
);
writeFileSync(path.join(STAGING, "pyproject.toml"), toml);

if (run(["uv", "build", STAGING, "--out-dir", DIST]) !== 0) fail("uv build of aswap failed");
rmSync(STAGING, { recursive: true, force: true });

const artifacts = readdirSync(DIST)
  .filter((a) => a.endsWith(".whl") || a.endsWith(".tar.gz"))
  .sort();
console.log(
  `\nbuilt ${artifacts.length} artifacts in dist/ (aswap ${version} = claude-swap ${upstreamVersion} + ${patchCount} patches):`,
);
for (const a of artifacts) console.log(`  ${a}`);
console.log(`\ninstall:  bun run install:cswap | install:aswap | install:all`);
