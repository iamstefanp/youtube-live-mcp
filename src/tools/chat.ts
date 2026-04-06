import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-list-chat-messages", "List live chat messages from a broadcast", {
    liveChatId: z.string().describe("The live chat ID (from broadcast's liveChatId field)"),
    pageToken: z.string().optional().describe("Pagination token"),
  }, async ({ liveChatId, pageToken }) => {
    try {
      const r = await client.listChatMessages(liveChatId, pageToken);
      const messages = (r.items || []).map(m => ({ id: m.id, author: m.authorDetails?.displayName, message: m.snippet?.textMessageDetails?.messageText || m.snippet?.displayMessage, publishedAt: m.snippet?.publishedAt, isChatOwner: m.authorDetails?.isChatOwner, isChatModerator: m.authorDetails?.isChatModerator, isChatSponsor: m.authorDetails?.isChatSponsor }));
      return { content: [{ type: "text" as const, text: j({ messages, nextPageToken: r.nextPageToken, pollingIntervalMillis: r.pollingIntervalMillis }) }] };
    } catch (e: any) { return err(e); }
  });

  server.tool("yt-send-chat-message", "Send a message to a live chat", {
    liveChatId: z.string().describe("The live chat ID"),
    message: z.string().describe("Message text to send"),
  }, async ({ liveChatId, message }) => {
    try { const m = await client.sendChatMessage(liveChatId, message); return { content: [{ type: "text" as const, text: j({ id: m.id, message: m.snippet?.textMessageDetails?.messageText, publishedAt: m.snippet?.publishedAt }) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-chat-message", "Delete a live chat message", { messageId: z.string().describe("The message ID") }, async ({ messageId }) => {
    try { await client.deleteChatMessage(messageId); return { content: [{ type: "text" as const, text: `Deleted message: ${messageId}` }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-list-moderators", "List live chat moderators", { liveChatId: z.string().describe("The live chat ID") }, async ({ liveChatId }) => {
    try { const r = await client.listModerators(liveChatId); const mods = (r.items || []).map(m => ({ id: m.id, channelId: m.snippet?.moderatorDetails?.channelId, displayName: m.snippet?.moderatorDetails?.displayName })); return { content: [{ type: "text" as const, text: j({ moderators: mods }) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-add-moderator", "Add a moderator to a live chat", {
    liveChatId: z.string().describe("The live chat ID"),
    channelId: z.string().describe("YouTube channel ID of the user to make moderator"),
  }, async ({ liveChatId, channelId }) => {
    try { const m = await client.addModerator(liveChatId, channelId); return { content: [{ type: "text" as const, text: j({ id: m.id, channelId: m.snippet?.moderatorDetails?.channelId, displayName: m.snippet?.moderatorDetails?.displayName }) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-remove-moderator", "Remove a moderator from a live chat", { moderatorId: z.string().describe("The moderator ID") }, async ({ moderatorId }) => {
    try { await client.removeModerator(moderatorId); return { content: [{ type: "text" as const, text: `Removed moderator: ${moderatorId}` }] }; } catch (e: any) { return err(e); }
  });
}
