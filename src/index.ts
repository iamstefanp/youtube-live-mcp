#!/usr/bin/env node
import { startServer } from "./server.js";
startServer().catch((error) => { console.error("Fatal error:", error.message); process.exit(1); });
