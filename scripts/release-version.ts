#!/usr/bin/env bun
/**
 * Compute the next release version from git tags (no version lives in the
 * source tree). Used by .github/workflows/publish.yml.
 *
 *   EXPECTED_VERSION=0.2.0 bun scripts/release-version.ts   exact version (must be new)
 *   VERSION_BUMP=patch|minor|major bun scripts/release-version.ts   bump the latest v* tag
 *
 * Writes `version=` and `tag=` to $GITHUB_OUTPUT when set, else prints them.
 */
import { appendFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function fail(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

export function listTags(): string[] {
  const p = Bun.spawnSync(["git", "tag", "-l", "v*", "--sort=-v:refname"], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (p.exitCode !== 0) fail(new TextDecoder().decode(p.stderr).trim() || "git tag failed");
  return new TextDecoder()
    .decode(p.stdout)
    .split("\n")
    .map((t) => t.trim())
    .filter((t) => SEMVER.test(t.slice(1)));
}

export function nextVersion(tags: string[], expected: string, bump: string): string {
  if (expected) {
    if (!SEMVER.test(expected)) fail(`expected version "${expected}" is not X.Y.Z`);
    if (tags.includes(`v${expected}`)) fail(`tag v${expected} already exists`);
    return expected;
  }
  const latest = tags[0]?.slice(1) ?? "0.0.0";
  const [major, minor, patch] = latest.split(".").map(Number);
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return fail(`unknown bump "${bump}" (patch, minor, major)`);
  }
}

if (import.meta.main) {
  const version = nextVersion(listTags(), process.env.EXPECTED_VERSION ?? "", process.env.VERSION_BUMP || "patch");
  const lines = `version=${version}\ntag=v${version}\n`;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines);
  process.stdout.write(lines);
}
