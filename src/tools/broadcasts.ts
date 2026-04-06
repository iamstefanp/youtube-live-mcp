import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-create-broadcast", "Create a new YouTube live broadcast", {
    title: z.string().describe("Broadcast title"),
    description: z.string().optional().describe("Broadcast description"),
    scheduledStartTime: z.string().optional().describe("ISO 8601 start time (defaults to now)"),
    privacyStatus: z.enum(["public", "unlisted", "private"]).optional().describe("Privacy status (default: unlisted)"),
    enableAutoStart: z.boolean().optional().describe("Auto-start when stream begins (default: false)"),
    enableAutoStop: z.boolean().optional().describe("Auto-stop when stream ends (default: true)"),
    enableDvr: z.boolean().optional().describe("Allow viewers to rewind (default: true)"),
    enableEmbed: z.boolean().optional().describe("Allow embedding (default: true)"),
  }, async (params) => {
    try {
      const b = await client.createBroadcast(params);
      return { content: [{ type: "text" as const, text: j({ id: b.id, title: b.snippet?.title, status: b.status?.lifeCycleStatus, privacyStatus: b.status?.privacyStatus, scheduledStartTime: b.snippet?.scheduledStartTime, liveChatId: b.snippet?.liveChatId }) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-list-broadcasts", "List YouTube live broadcasts", {
    broadcastStatus: z.enum(["all", "active", "completed", "upcoming"]).optional().describe("Filter by status (default: all)"),
    maxResults: z.number().optional().describe("Max results (default: 10)"),
    pageToken: z.string().optional().describe("Pagination token"),
  }, async (params) => {
    try {
      const r = await client.listBroadcasts(params);
      const broadcasts = (r.items || []).map(b => ({ id: b.id, title: b.snippet?.title, status: b.status?.lifeCycleStatus, privacyStatus: b.status?.privacyStatus, scheduledStartTime: b.snippet?.scheduledStartTime, actualStartTime: b.snippet?.actualStartTime, liveChatId: b.snippet?.liveChatId }));
      return { content: [{ type: "text" as const, text: j({ broadcasts, nextPageToken: r.nextPageToken, totalResults: r.pageInfo?.totalResults }) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-get-broadcast", "Get broadcast details", { broadcastId: z.string().describe("The broadcast ID") }, async ({ broadcastId }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.getBroadcast(broadcastId)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-update-broadcast", "Update a broadcast", {
    broadcastId: z.string().describe("The broadcast ID"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    scheduledStartTime: z.string().optional().describe("New start time (ISO 8601)"),
    privacyStatus: z.enum(["public", "unlisted", "private"]).optional().describe("New privacy"),
  }, async (params) => {
    try { const b = await client.updateBroadcast(params); return { content: [{ type: "text" as const, text: j({ id: b.id, title: b.snippet?.title, status: b.status?.lifeCycleStatus, privacyStatus: b.status?.privacyStatus }) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-broadcast", "Delete a broadcast", { broadcastId: z.string().describe("The broadcast ID") }, async ({ broadcastId }) => {
    try { await client.deleteBroadcast(broadcastId); return { content: [{ type: "text" as const, text: `Deleted broadcast: ${broadcastId}` }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-bind-stream", "Bind a live stream to a broadcast", { broadcastId: z.string().describe("The broadcast ID"), streamId: z.string().describe("The stream ID") }, async ({ broadcastId, streamId }) => {
    try { const b = await client.bindStream(broadcastId, streamId); return { content: [{ type: "text" as const, text: j({ id: b.id, title: b.snippet?.title, boundStreamId: b.contentDetails?.boundStreamId, status: b.status?.lifeCycleStatus }) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-transition-broadcast", "Transition a broadcast to a new status (testing, live, or complete)", {
    broadcastId: z.string().describe("The broadcast ID"),
    status: z.enum(["testing", "live", "complete"]).describe("Target status: testing (validate), live (go live), complete (end)"),
  }, async ({ broadcastId, status }) => {
    try { const b = await client.transitionBroadcast(broadcastId, status); return { content: [{ type: "text" as const, text: j({ id: b.id, title: b.snippet?.title, lifeCycleStatus: b.status?.lifeCycleStatus }) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-insert-cuepoint", "Insert an ad break cue point during a live broadcast", {
    broadcastId: z.string().describe("The broadcast ID"),
    durationSecs: z.number().optional().describe("Duration in seconds (default: 30)"),
  }, async ({ broadcastId, durationSecs }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.insertCuepoint(broadcastId, durationSecs)) }] }; } catch (e: any) { return err(e); }
  });
}
