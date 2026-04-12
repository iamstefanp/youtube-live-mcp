import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YouTubeLiveClient } from "../client.js";

const j = (o: any) => JSON.stringify(o, null, 2);
const err = (e: any) => ({ content: [{ type: "text" as const, text: `Error: ${e.message}` }], isError: true as const });

export function initialize(server: McpServer, client: YouTubeLiveClient): void {
  server.tool("yt-list-comments", "List top-level comments on a video", {
    videoId: z.string().describe("The video ID"),
    maxResults: z.number().optional().describe("Max results (default: 20)"),
    pageToken: z.string().optional().describe("Pagination token"),
    order: z.enum(["time", "relevance"]).optional().describe("Sort order (default: time)"),
  }, async (params) => {
    try { return { content: [{ type: "text" as const, text: j(await client.listComments(params)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-reply-to-comment", "Reply to a comment on a video", {
    parentId: z.string().describe("The parent comment ID to reply to"),
    text: z.string().describe("Reply text"),
  }, async ({ parentId, text }) => {
    try { return { content: [{ type: "text" as const, text: j(await client.replyToComment(parentId, text)) }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-delete-comment", "Delete a comment (must be owned by the authenticated channel)", {
    commentId: z.string().describe("The comment ID to delete"),
  }, async ({ commentId }) => {
    try { await client.deleteComment(commentId); return { content: [{ type: "text" as const, text: `Deleted comment: ${commentId}` }] }; } catch (e: any) { return err(e); }
  });

  server.tool("yt-set-comment-moderation", "Hold a comment for review or approve/reject it", {
    commentId: z.string().describe("The comment ID"),
    moderationStatus: z.enum(["published", "heldForReview", "rejected"]).describe("New moderation status"),
  }, async ({ commentId, moderationStatus }) => {
    try { await client.setCommentModerationStatus(commentId, moderationStatus); return { content: [{ type: "text" as const, text: `Comment ${commentId} set to: ${moderationStatus}` }] }; } catch (e: any) { return err(e); }
  });
}
