#!/usr/bin/env bun
/**
 * Build, then install with uv tool:
 *
 *   bun run install:cswap   patched claude-swap in place of the PyPI package (command: cswap)
 *   bun run install:aswap   the aswap package, side by side with upstream cswap (command: aswap)
 *   bun run install:all     both
 *
 * Both wheels are self-contained (see scripts/build.ts).
 */
import { readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const DIST = path.join(ROOT, "dist");

function run(args: string[]): void {
  const p = Bun.spawnSync(args, { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
  if (p.exitCode !== 0) {
    console.error(`error: ${args.join(" ")} failed`);
    process.exit(p.exitCode || 1);
  }
}

function wheel(prefix: string): string {
  const name = readdirSync(DIST).find((f) => f.startsWith(`${prefix}-`) && f.endsWith(".whl"));
  if (!name) {
    console.error(`error: no ${prefix} wheel in dist/`);
    process.exit(1);
  }
  return path.join("dist", name);
}

const target = process.argv[2] ?? "all";
if (!["cswap", "aswap", "all"].includes(target)) {
  console.error(`usage: bun scripts/install.ts <cswap|aswap|all>`);
  process.exit(1);
}

run(["bun", path.join(ROOT, "scripts", "build.ts")]);
const cswapWheel = wheel("claude_swap");

if (target === "cswap" || target === "all") {
  console.log(`\ninstalling patched claude-swap (cswap) from ${cswapWheel}`);
  run(["uv", "tool", "install", "--force", "--reinstall", cswapWheel]);
}
if (target === "aswap" || target === "all") {
  const aswapWheel = wheel("aswap");
  console.log(`\ninstalling aswap from ${aswapWheel}`);
  run(["uv", "tool", "install", "--force", "--reinstall", aswapWheel]);
}
