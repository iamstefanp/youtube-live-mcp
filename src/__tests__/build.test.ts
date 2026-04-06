import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = join(import.meta.dirname, "..", "..");
const BUILD = join(ROOT, "build");

describe("Layer 1: Build Verification", () => {
  it("compiles TypeScript without errors", () => {
    const result = execSync("./node_modules/.bin/tsc --noEmit", {
      cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"],
    });
    expect(result.trim()).toBe("");
  });

  it("build output directory exists", () => { expect(existsSync(BUILD)).toBe(true); });

  it("entry point exists at build/index.js", () => { expect(existsSync(join(BUILD, "index.js"))).toBe(true); });

  it("entry point has shebang", () => {
    const content = execSync(`head -1 "${join(BUILD, "index.js")}"`, { encoding: "utf-8" });
    expect(content.trim()).toBe("#!/usr/bin/env node");
  });

  it("entry point is executable", () => {
    const stat = statSync(join(BUILD, "index.js"));
    expect((stat.mode & 0o111) !== 0).toBe(true);
  });

  it("all expected build files exist", () => {
    for (const f of ["index.js","server.js","auth.js","client.js","tools/index.js","tools/broadcasts.js","tools/streams.js","tools/chat.js","tools/status.js"]) {
      expect(existsSync(join(BUILD, f)), `Missing: build/${f}`).toBe(true);
    }
  });

  it("declaration files are generated", () => {
    for (const f of ["index.d.ts","server.d.ts","auth.d.ts","client.d.ts"]) {
      expect(existsSync(join(BUILD, f)), `Missing: build/${f}`).toBe(true);
    }
  });
});
