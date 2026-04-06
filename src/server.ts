import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getAuthenticatedClient } from "./auth.js";
import { YouTubeLiveClient } from "./client.js";
import { initializeAll } from "./tools/index.js";

export async function startServer(): Promise<void> {
  console.error("YouTube Live MCP Server starting...");
  console.error("Authenticating with YouTube...");
  const auth = await getAuthenticatedClient();
  const ytClient = new YouTubeLiveClient(auth);
  console.error("Authenticated with YouTube.");
  const server = new McpServer({ name: "youtube-live-mcp", version: "1.0.0" });
  initializeAll(server, ytClient);
  console.error("Initialized MCP tools.");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YouTube Live MCP Server running on stdio.");
  const shutdown = async () => { console.error("Shutting down..."); await server.close(); process.exit(0); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
