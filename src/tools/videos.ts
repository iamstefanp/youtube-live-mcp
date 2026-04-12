import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-list-videos", "List videos uploaded to a channel", {
    channelId: z.string().optional().describe("Channel ID (defaults to authenticated user's channel)"),
    maxResults: z.number().optional().describe("Max results to return (default: 25)"),
    pageToken: z.string().optional().describe("Pagination token"),
  }, async (params) => {
    try {
      const r = await client.listVideos(params);
      return { content: [{ type: "text" as const, text: j(r) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-get-video", "Get full details for a video", {
    videoId: z.string().describe("The video ID"),
  }, async ({ videoId }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.getVideo(videoId)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-update-video", "Update a video's title, description, tags, category, privacy, or comment settings", {
    videoId: z.string().describe("The video ID"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    tags: z.array(z.string()).optional().describe("Tags array"),
    categoryId: z.string().optional().describe("YouTube category ID (e.g. '28' = Science & Technology)"),
    privacyStatus: z.enum(["public", "unlisted", "private"]).optional().describe("Privacy status"),
    madeForKids: z.boolean().optional().describe("Whether the video is made for kids"),
    commentability: z.enum(["allComments", "commentsDisabled", "friendsComments"]).optional().describe("Comment settings"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.updateVideo(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-video", "Delete a video permanently", {
    videoId: z.string().describe("The video ID to delete"),
  }, async ({ videoId }) => {
    try { await client.deleteVideo(videoId); return { content: [{ type: "text" as const, text: `Deleted video: ${videoId}` }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-set-thumbnail", "Upload a custom thumbnail for a video from a local file path", {
    videoId: z.string().describe("The video ID"),
    filePath: z.string().describe("Absolute path to the image file (JPG or PNG, max 2MB)"),
  }, async ({ videoId, filePath }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.setVideoThumbnail(videoId, filePath)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-list-captions", "List caption tracks for a video", {
    videoId: z.string().describe("The video ID"),
  }, async ({ videoId }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.listCaptions(videoId)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-upload-captions", "Upload an SRT caption track to a video", {
    videoId: z.string().describe("The video ID"),
    language: z.string().describe("BCP-47 language code (e.g. 'en', 'de', 'fr')"),
    name: z.string().describe("Caption track name (e.g. 'English', 'Auto-generated')"),
    srtContent: z.string().describe("Full SRT file content as a string"),
    isDraft: z.boolean().optional().describe("If true, captions won't be visible publicly (default: false)"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.uploadCaption(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-captions", "Delete a caption track from a video", {
    captionId: z.string().describe("The caption track ID"),
  }, async ({ captionId }) => {
    try { await client.deleteCaption(captionId); return { content: [{ type: "text" as const, text: `Deleted caption: ${captionId}` }] }; } catch (e: any) { return err(e); }
  });
}
