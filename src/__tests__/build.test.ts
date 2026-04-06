import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = join(import.meta.dirname, "..", "..");
const BUILD = join(ROOT, "build");
const NODE = process.execPath; // path to the current Node binary — portable across all platforms

describe("Layer 1: Build Verification", () => {
  it("compiles TypeScript without errors", { timeout: 30000 }, () => {
    const result = execSync(`${NODE} ./node_modules/.bin/tsc --noEmit`, {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    // tsc returns empty string on success
    expect(result.trim()).toBe("");
  });

  it("build output directory exists", () => {
    expect(existsSync(BUILD)).toBe(true);
  });

  it("entry point exists at build/index.js", () => {
    const entry = join(BUILD, "index.js");
    expect(existsSync(entry)).toBe(true);
  });

  it("entry point has shebang", () => {
    const entry = join(BUILD, "index.js");
    const content = execSync(`head -1 "${entry}"`, { encoding: "utf-8" });
    expect(content.trim()).toBe("#!/usr/bin/env node");
  });

  it("entry point is executable", () => {
    const entry = join(BUILD, "index.js");
    const stat = statSync(entry);
    const isExecutable = (stat.mode & 0o111) !== 0;
    expect(isExecutable).toBe(true);
  });

  it("all expected build files exist", () => {
    const expected = [
      "index.js",
      "server.js",
      "auth.js",
      "client.js",
      "tools/index.js",
      "tools/broadcasts.js",
      "tools/streams.js",
      "tools/chat.js",
      "tools/status.js",
    ];
    for (const file of expected) {
      expect(existsSync(join(BUILD, file)), `Missing: build/${file}`).toBe(true);
    }
  });

  it("declaration files are generated", () => {
    const expected = ["index.d.ts", "server.d.ts", "auth.d.ts", "client.d.ts"];
    for (const file of expected) {
      expect(existsSync(join(BUILD, file)), `Missing: build/${file}`).toBe(true);
    }
  });
});
