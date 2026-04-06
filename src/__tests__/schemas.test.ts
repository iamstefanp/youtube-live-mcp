import { describe, it, expect } from "vitest";
import { z } from "zod";

const broadcastSchemas = {
  create: z.object({ title: z.string(), description: z.string().optional(), scheduledStartTime: z.string().optional(), privacyStatus: z.enum(["public","unlisted","private"]).optional(), enableAutoStart: z.boolean().optional(), enableAutoStop: z.boolean().optional(), enableDvr: z.boolean().optional(), enableEmbed: z.boolean().optional() }),
  list: z.object({ broadcastStatus: z.enum(["all","active","completed","upcoming"]).optional(), maxResults: z.number().optional(), pageToken: z.string().optional() }),
  get: z.object({ broadcastId: z.string() }),
  update: z.object({ broadcastId: z.string(), title: z.string().optional(), description: z.string().optional(), scheduledStartTime: z.string().optional(), privacyStatus: z.enum(["public","unlisted","private"]).optional() }),
  delete: z.object({ broadcastId: z.string() }),
  bind: z.object({ broadcastId: z.string(), streamId: z.string() }),
  transition: z.object({ broadcastId: z.string(), status: z.enum(["testing","live","complete"]) }),
  cuepoint: z.object({ broadcastId: z.string(), durationSecs: z.number().optional() }),
};
const streamSchemas = {
  create: z.object({ title: z.string(), resolution: z.enum(["240p","360p","480p","720p","1080p","1440p","2160p"]).optional(), frameRate: z.enum(["30fps","60fps"]).optional(), ingestionType: z.enum(["rtmp","dash","webrtc","hls"]).optional() }),
  list: z.object({ maxResults: z.number().optional(), pageToken: z.string().optional() }),
  get: z.object({ streamId: z.string() }),
  delete: z.object({ streamId: z.string() }),
};
const chatSchemas = {
  listMessages: z.object({ liveChatId: z.string(), pageToken: z.string().optional() }),
  sendMessage: z.object({ liveChatId: z.string(), message: z.string() }),
  deleteMessage: z.object({ messageId: z.string() }),
  listModerators: z.object({ liveChatId: z.string() }),
  addModerator: z.object({ liveChatId: z.string(), channelId: z.string() }),
  removeModerator: z.object({ moderatorId: z.string() }),
};
const statusSchemas = {
  broadcastStatus: z.object({ broadcastId: z.string() }),
  streamHealth: z.object({ streamId: z.string() }),
};

describe("Layer 3: Schema Validation", () => {
  describe("Broadcast schemas", () => {
    it("create: accepts valid input", () => { expect(() => broadcastSchemas.create.parse({ title: "Test" })).not.toThrow(); });
    it("create: accepts full input", () => { expect(() => broadcastSchemas.create.parse({ title: "Full", description: "desc", scheduledStartTime: "2026-04-06T20:00:00Z", privacyStatus: "unlisted", enableAutoStart: true, enableAutoStop: true, enableDvr: false, enableEmbed: true })).not.toThrow(); });
    it("create: rejects missing title", () => { expect(() => broadcastSchemas.create.parse({})).toThrow(); });
    it("create: rejects invalid privacy", () => { expect(() => broadcastSchemas.create.parse({ title: "T", privacyStatus: "secret" })).toThrow(); });
    it("list: accepts empty input", () => { expect(() => broadcastSchemas.list.parse({})).not.toThrow(); });
    it("list: rejects invalid status", () => { expect(() => broadcastSchemas.list.parse({ broadcastStatus: "invalid" })).toThrow(); });
    it("transition: accepts valid status", () => { expect(() => broadcastSchemas.transition.parse({ broadcastId: "abc", status: "live" })).not.toThrow(); });
    it("transition: rejects invalid status", () => { expect(() => broadcastSchemas.transition.parse({ broadcastId: "abc", status: "paused" })).toThrow(); });
    it("bind: requires both IDs", () => { expect(() => broadcastSchemas.bind.parse({ broadcastId: "a" })).toThrow(); expect(() => broadcastSchemas.bind.parse({ broadcastId: "a", streamId: "b" })).not.toThrow(); });
  });
  describe("Stream schemas", () => {
    it("create: accepts minimal", () => { expect(() => streamSchemas.create.parse({ title: "S" })).not.toThrow(); });
    it("create: accepts full", () => { expect(() => streamSchemas.create.parse({ title: "S", resolution: "1080p", frameRate: "60fps", ingestionType: "rtmp" })).not.toThrow(); });
    it("create: rejects invalid resolution", () => { expect(() => streamSchemas.create.parse({ title: "S", resolution: "4k" })).toThrow(); });
    it("create: rejects invalid frame rate", () => { expect(() => streamSchemas.create.parse({ title: "S", frameRate: "120fps" })).toThrow(); });
    it("create: rejects invalid ingestion", () => { expect(() => streamSchemas.create.parse({ title: "S", ingestionType: "ftp" })).toThrow(); });
  });
  describe("Chat schemas", () => {
    it("sendMessage: requires both fields", () => { expect(() => chatSchemas.sendMessage.parse({ liveChatId: "a" })).toThrow(); expect(() => chatSchemas.sendMessage.parse({ liveChatId: "a", message: "hi" })).not.toThrow(); });
    it("addModerator: requires both fields", () => { expect(() => chatSchemas.addModerator.parse({ liveChatId: "a" })).toThrow(); expect(() => chatSchemas.addModerator.parse({ liveChatId: "a", channelId: "b" })).not.toThrow(); });
  });
  describe("Status schemas", () => {
    it("broadcastStatus: requires ID", () => { expect(() => statusSchemas.broadcastStatus.parse({})).toThrow(); expect(() => statusSchemas.broadcastStatus.parse({ broadcastId: "a" })).not.toThrow(); });
    it("streamHealth: requires ID", () => { expect(() => statusSchemas.streamHealth.parse({})).toThrow(); expect(() => statusSchemas.streamHealth.parse({ streamId: "a" })).not.toThrow(); });
  });
  describe("Coverage", () => {
    const all = [...Object.entries(broadcastSchemas),...Object.entries(streamSchemas),...Object.entries(chatSchemas),...Object.entries(statusSchemas)];
    it("covers all 20 tools", () => { expect(all.length).toBe(20); });
    for (const [name, schema] of all) { it(`${name}: is valid Zod schema`, () => { expect(typeof schema.parse).toBe("function"); }); }
  });
});
