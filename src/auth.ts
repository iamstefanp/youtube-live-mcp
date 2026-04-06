import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { createServer } from "http";
import { URL } from "url";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import open from "open";

const TOKEN_DIR = join(homedir(), ".youtube-live-mcp");
const TOKEN_PATH = join(TOKEN_DIR, "tokens.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube"];
const REDIRECT_PORT = 8976;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date: number;
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET environment variables. " +
        "Create OAuth2 credentials at https://console.cloud.google.com/apis/credentials"
    );
  }
  return { clientId, clientSecret };
}

function loadStoredTokens(): StoredTokens | null {
  if (!existsSync(TOKEN_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, "utf-8")) as StoredTokens;
  } catch {
    return null;
  }
}

function storeTokens(tokens: StoredTokens): void {
  if (!existsSync(TOKEN_DIR)) mkdirSync(TOKEN_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

async function authorizeViaBrowser(oauth2Client: OAuth2Client): Promise<void> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  return new Promise<void>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith("/callback")) {
          res.writeHead(404);
          res.end();
          return;
        }

        const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Authorization denied</h1><p>You can close this tab.</p></body></html>");
          server.close();
          reject(new Error(`Authorization denied: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Missing authorization code</h1></body></html>");
          server.close();
          reject(new Error("No authorization code received"));
          return;
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        storeTokens({
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token!,
          token_type: tokens.token_type!,
          expiry_date: tokens.expiry_date!,
        });

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body><h1>YouTube Live MCP authorized</h1><p>You can close this tab and return to Claude Code.</p></body></html>"
        );
        server.close();
        resolve();
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.error("Opening browser for YouTube authorization...");
      open(authUrl).catch(() => {
        console.error(`Open this URL in your browser:\n${authUrl}`);
      });
    });

    server.on("error", (err) => {
      reject(new Error(`Failed to start auth callback server on port ${REDIRECT_PORT}: ${err.message}`));
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 120 seconds"));
    }, 120_000);
  });
}

export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const { clientId, clientSecret } = getCredentials();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const storedTokens = loadStoredTokens();

  if (storedTokens) {
    oauth2Client.setCredentials(storedTokens);

    if (storedTokens.expiry_date < Date.now() + 300_000) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        const updated: StoredTokens = {
          access_token: credentials.access_token!,
          refresh_token: credentials.refresh_token || storedTokens.refresh_token,
          token_type: credentials.token_type!,
          expiry_date: credentials.expiry_date!,
        };
        oauth2Client.setCredentials(updated);
        storeTokens(updated);
      } catch {
        console.error("Token refresh failed, re-authorizing...");
        await authorizeViaBrowser(oauth2Client);
      }
    }
  } else {
    await authorizeViaBrowser(oauth2Client);
  }

  oauth2Client.on("tokens", (tokens) => {
    const current = loadStoredTokens();
    if (current && tokens.access_token) {
      storeTokens({
        ...current,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date || current.expiry_date,
      });
    }
  });

  return oauth2Client;
}
