import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-list-playlists", "List playlists for the authenticated channel", {
    channelId: z.string().optional().describe("Channel ID (defaults to authenticated user's channel)"),
    maxResults: z.number().optional().describe("Max results (default: 25)"),
    pageToken: z.string().optional().describe("Pagination token"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.listPlaylists(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-create-playlist", "Create a new playlist", {
    title: z.string().describe("Playlist title"),
    description: z.string().optional().describe("Playlist description"),
    privacyStatus: z.enum(["public", "unlisted", "private"]).optional().describe("Privacy status (default: public)"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.createPlaylist(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-update-playlist", "Update a playlist's title, description, or privacy", {
    playlistId: z.string().describe("The playlist ID"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    privacyStatus: z.enum(["public", "unlisted", "private"]).optional().describe("New privacy status"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.updatePlaylist(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-playlist", "Delete a playlist (videos are not deleted)", {
    playlistId: z.string().describe("The playlist ID to delete"),
  }, async ({ playlistId }) => {
    try { await client.deletePlaylist(playlistId); return { content: [{ type: "text" as const, text: `Deleted playlist: ${playlistId}` }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-add-to-playlist", "Add a video to a playlist", {
    playlistId: z.string().describe("The playlist ID"),
    videoId: z.string().describe("The video ID to add"),
    position: z.number().optional().describe("Position in playlist (0-indexed, omit to add at end)"),
  }, async ({ playlistId, videoId, position }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.addToPlaylist(playlistId, videoId, position)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-remove-from-playlist", "Remove a video from a playlist by playlist item ID", {
    playlistItemId: z.string().describe("The playlist item ID (not the video ID — use yt-list-playlists to find it)"),
  }, async ({ playlistItemId }) => {
    try { await client.removeFromPlaylist(playlistItemId); return { content: [{ type: "text" as const, text: `Removed playlist item: ${playlistItemId}` }] }; } catch (e: any) { return err(e); }
  });
}
