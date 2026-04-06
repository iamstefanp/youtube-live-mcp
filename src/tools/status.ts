import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-get-broadcast-status", "Get the current lifecycle status of a broadcast", { broadcastId: z.string().describe("The broadcast ID") }, async ({ broadcastId }) => {
    try {
      const b = await client.getBroadcast(broadcastId);
      return { content: [{ type: "text" as const, text: j({ id: b.id, title: b.snippet?.title, lifeCycleStatus: b.status?.lifeCycleStatus, recordingStatus: b.status?.recordingStatus, privacyStatus: b.status?.privacyStatus, scheduledStartTime: b.snippet?.scheduledStartTime, actualStartTime: b.snippet?.actualStartTime, actualEndTime: b.snippet?.actualEndTime, liveChatId: b.snippet?.liveChatId, boundStreamId: b.contentDetails?.boundStreamId }) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-get-stream-health", "Get real-time health status of a live stream", { streamId: z.string().describe("The stream ID") }, async ({ streamId }) => {
    try {
      const s = await client.getStream(streamId);
      const h = s.status?.healthStatus;
      return { content: [{ type: "text" as const, text: j({ id: s.id, title: s.snippet?.title, streamStatus: s.status?.streamStatus, healthStatus: h?.status, configurationIssues: h?.configurationIssues || [], lastUpdateTime: h?.lastUpdateTimeSeconds, resolution: s.cdn?.resolution, frameRate: s.cdn?.frameRate }) }] };
    } catch (e: any) { return err(e); }
  });
}
