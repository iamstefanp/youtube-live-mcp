import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-create-stream", "Create a new live stream (returns RTMP URL and stream key for OBS)", {
    title: z.string().describe("Stream title"),
    resolution: z.enum(["240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"]).optional().describe("Resolution (default: 1080p)"),
    frameRate: z.enum(["30fps", "60fps"]).optional().describe("Frame rate (default: 60fps)"),
    ingestionType: z.enum(["rtmp", "dash", "webrtc", "hls"]).optional().describe("Protocol (default: rtmp)"),
  }, async (params) => {
    try {
      const s = await client.createStream(params);
      const i = s.cdn?.ingestionInfo;
      return { content: [{ type: "text" as const, text: j({ id: s.id, title: s.snippet?.title, rtmpUrl: i?.ingestionAddress, rtmpsUrl: i?.rtmpsIngestionAddress, streamKey: i?.streamName, resolution: s.cdn?.resolution, frameRate: s.cdn?.frameRate, status: s.status?.streamStatus, healthStatus: s.status?.healthStatus?.status }) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-list-streams", "List your live streams", {
    maxResults: z.number().optional().describe("Max results (default: 10)"),
    pageToken: z.string().optional().describe("Pagination token"),
  }, async (params) => {
    try {
      const r = await client.listStreams(params);
      const streams = (r.items || []).map(s => ({ id: s.id, title: s.snippet?.title, rtmpUrl: s.cdn?.ingestionInfo?.ingestionAddress, streamKey: s.cdn?.ingestionInfo?.streamName, resolution: s.cdn?.resolution, frameRate: s.cdn?.frameRate, status: s.status?.streamStatus, healthStatus: s.status?.healthStatus?.status }));
      return { content: [{ type: "text" as const, text: j({ streams, nextPageToken: r.nextPageToken, totalResults: r.pageInfo?.totalResults }) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-get-stream", "Get details of a specific live stream including health status", { streamId: z.string().describe("The stream ID") }, async ({ streamId }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.getStream(streamId)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-stream", "Delete a live stream", { streamId: z.string().describe("The stream ID") }, async ({ streamId }) => {
    try { await client.deleteStream(streamId); return { content: [{ type: "text" as const, text: `Deleted stream: ${streamId}` }] }; } catch (e: any) { return err(e); }
  });
}
