import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeLiveClient } from "../client.js";
import * as broadcasts from "./broadcasts.js";
import * as streams from "./streams.js";
import * as chat from "./chat.js";
import * as status from "./status.js";

export function initializeAll(server: McpServer, client: YouTubeLiveClient): void {
  broadcasts.initialize(server, client);
  streams.initialize(server, client);
  chat.initialize(server, client);
  status.initialize(server, client);
}
