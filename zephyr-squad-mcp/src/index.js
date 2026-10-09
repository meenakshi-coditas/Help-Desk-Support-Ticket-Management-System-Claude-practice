#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ZephyrSquadClient } from "./client.js";

const client = new ZephyrSquadClient({
  accessKey: process.env.ZEPHYR_SQUAD_ACCESS_KEY,
  secretKey: process.env.ZEPHYR_SQUAD_SECRET_KEY,
  accountId: process.env.ZEPHYR_SQUAD_ACCOUNT_ID,
  baseUrl: process.env.ZEPHYR_SQUAD_BASE_URL
});

const server = new McpServer({ name: "zephyr-squad-mcp", version: "0.1.0" });

// Deliberately no outputSchema on any tool here — a real bug hit and
// patched around earlier this session was a client-side validator
// rejecting a server's declared outputSchema dialect. Omitting it
// sidesteps that entirely rather than risking the same failure mode here.

server.registerTool(
  "zephyr_squad_raw_request",
  {
    title: "Zephyr Squad raw request",
    description:
      "Make a raw authenticated request to the Zephyr Squad Cloud REST API. " +
      "For discovering/verifying the correct endpoint paths for this account " +
      "before wrapping them in purpose-built tools — start here, not with guessed paths. " +
      "Remember the base URL is origin-only, so include the full path e.g. " +
      "/connect/public/rest/api/1.0/... in the path argument. " +
      "PUT and DELETE are for in-place edits/removals on a single resource " +
      "(e.g. PUT /teststep/{issueId}/{id} to edit one step, DELETE on the same " +
      "path to remove it) — confirm the exact path against the API docs first, " +
      "since a wrong path plus a destructive method is harder to undo than a bad GET.",
    inputSchema: {
      method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
      path: z.string().describe("Full path after the domain, e.g. /connect/public/rest/api/1.0/projects"),
      queryParams: z.record(z.string()).optional(),
      body: z.record(z.any()).optional()
    }
  },
  async ({ method, path, queryParams, body }) => {
    try {
      const result = await client.request(method, path, { queryParams, body });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

// Belt-and-suspenders keepalive: in some host environments a stdio
// transport's own stdin listener isn't enough to keep Node's event loop
// alive (observed directly while testing this file earlier this session —
// a backgrounded shell job exited right after connect() with no error,
// even with stdin left open). A cheap, infrequent no-op timer guarantees
// the process doesn't exit prematurely regardless of the host's stdin
// plumbing.
setInterval(() => {}, 60_000);
