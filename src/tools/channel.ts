import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-get-channel", "Get channel info, stats, and branding for all channels managed by the authenticated account", {
    channelId: z.string().optional().describe("Specific channel ID (omit to get all managed channels)"),
  }, async ({ channelId }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.getChannels(channelId)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-update-channel", "Update channel description, keywords, country, or default language", {
    channelId: z.string().describe("The channel ID to update"),
    description: z.string().optional().describe("Channel description (max 1000 chars)"),
    keywords: z.string().optional().describe("Space-separated keywords for channel discovery"),
    country: z.string().optional().describe("ISO 3166-1 alpha-2 country code (e.g. 'DE', 'GB', 'US')"),
    defaultLanguage: z.string().optional().describe("BCP-47 language code for channel content (e.g. 'en', 'de')"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.updateChannel(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-upload-channel-banner", "Upload a banner image for a channel (2048x1152px recommended, max 6MB). Note: channel profile picture cannot be changed via the YouTube API — it is tied to the Google account profile picture.", {
    channelId: z.string().describe("The channel ID to apply the banner to"),
    filePath: z.string().describe("Absolute path to the banner image file (JPG or PNG)"),
  }, async ({ channelId, filePath }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.uploadChannelBanner(channelId, filePath)) }] }; } catch (e: any) { return err(e); }
  });
}
