import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..", "..");
const ENTRY = join(ROOT, "build", "index.js");

describe("Layer 2: Server Startup", () => {
  it("fails gracefully when YOUTUBE_CLIENT_ID is missing", () => {
    try {
      execSync(`node "${ENTRY}"`, { cwd: ROOT, encoding: "utf-8", timeout: 5000, env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "test" }, stdio: ["pipe", "pipe", "pipe"] });
      expect.fail("Should have thrown");
    } catch (err: any) { expect(err.stderr || "").toContain("Missing YOUTUBE_CLIENT_ID"); }
  });

  it("fails gracefully when YOUTUBE_CLIENT_SECRET is missing", () => {
    try {
      execSync(`node "${ENTRY}"`, { cwd: ROOT, encoding: "utf-8", timeout: 5000, env: { ...process.env, YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "" }, stdio: ["pipe", "pipe", "pipe"] });
      expect.fail("Should have thrown");
    } catch (err: any) { expect(err.stderr || "").toContain("Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET"); }
  });

  it("fails gracefully when both env vars are missing", () => {
    try {
      execSync(`node "${ENTRY}"`, { cwd: ROOT, encoding: "utf-8", timeout: 5000, env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "" }, stdio: ["pipe", "pipe", "pipe"] });
      expect.fail("Should have thrown");
    } catch (err: any) { expect(err.stderr || "").toContain("Missing"); }
  });

  it("does not crash with unhandled rejection on missing credentials", () => {
    try {
      execSync(`node "${ENTRY}"`, { cwd: ROOT, encoding: "utf-8", timeout: 5000, env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "" }, stdio: ["pipe", "pipe", "pipe"] });
    } catch (err: any) { expect(err.stderr || "").not.toContain("UnhandledPromiseRejection"); }
  });
});
