import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..", "..");
const ENTRY = join(ROOT, "build", "index.js");
const NODE = process.execPath; // path to the current Node binary — portable across all platforms

describe("Layer 2: Server Startup", () => {
  it("fails gracefully when YOUTUBE_CLIENT_ID is missing", () => {
    try {
      execSync(`"${NODE}" "${ENTRY}"`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "test" },
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      const stderr = err.stderr || "";
      expect(stderr).toContain("Missing YOUTUBE_CLIENT_ID");
    }
  });

  it("fails gracefully when YOUTUBE_CLIENT_SECRET is missing", () => {
    try {
      execSync(`"${NODE}" "${ENTRY}"`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "" },
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      const stderr = err.stderr || "";
      expect(stderr).toContain("Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET");
    }
  });

  it("fails gracefully when both env vars are missing", () => {
    try {
      execSync(`"${NODE}" "${ENTRY}"`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "" },
        stdio: ["pipe", "pipe", "pipe"],
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      const stderr = err.stderr || "";
      expect(stderr).toContain("Missing");
    }
  });

  it("does not crash with a stack trace on missing credentials", () => {
    try {
      execSync(`"${NODE}" "${ENTRY}"`, {
        cwd: ROOT,
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "" },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err: any) {
      const stderr = err.stderr || "";
      // Should show a clean error message, not an unhandled promise rejection
      expect(stderr).not.toContain("UnhandledPromiseRejection");
    }
  });
});
