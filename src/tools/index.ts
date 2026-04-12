import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YouTubeLiveClient } from "../client.js";
import * as broadcasts from "./broadcasts.js";
import * as streams from "./streams.js";
import * as chat from "./chat.js";
import * as status from "./status.js";
import * as videos from "./videos.js";
import * as channel from "./channel.js";
import * as playlists from "./playlists.js";
import * as comments from "./comments.js";

export function initializeAll(server: McpServer, client: YouTubeLiveClient): void {
  broadcasts.initialize(server, client);
  streams.initialize(server, client);
  chat.initialize(server, client);
  status.initialize(server, client);
  videos.initialize(server, client);
  channel.initialize(server, client);
  playlists.initialize(server, client);
  comments.initialize(server, client);
}
