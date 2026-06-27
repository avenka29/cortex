import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { DatabaseService } from "./database/DatabaseService.js";
import { ConfigLoader } from "./core/ConfigLoader.js";
import { GraphService } from "./graph/GraphService.js";

import { ToolProvider } from "./mcp/providers/ToolProvider.js";
import { GraphToolProvider } from "./mcp/providers/GraphToolProvider.js";
import { VectorToolProvider } from "./mcp/providers/VectorToolProvider.js";
import { EmbeddingService } from "./vector/EmbeddingService.js";

// ==========================================
// 1. BOOT SEQUENCE: Initialize the Core Pillars
// ==========================================

const configLoader = new ConfigLoader();
configLoader.loadConfig(); // Will throw and crash on startup if config is fatally broken

const database = new DatabaseService();
const graphService = new GraphService(database, configLoader);
graphService.loadGraph(); // Pulls SQLite topology into the O(1) memory map

// ==========================================
// 2. SERVER & PROVIDER INITIALIZATION
// ==========================================

const server = new Server(
  { name: "cortex-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// The Registry of all Tool Providers. 
// We drop the VectorToolProvider right here to seamlessly merge it into the MCP server!
const embeddingService = new EmbeddingService();
const providers: ToolProvider[] = [
  new GraphToolProvider(graphService, database, configLoader),
  new VectorToolProvider(database, embeddingService)
];

// ==========================================
// 3. MCP ROUTING LOGIC
// ==========================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Map through every registered provider and merge their tools into one master list
  const allTools = providers.flatMap(provider => provider.getDefinitions());
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Route the request to the first provider that knows how to handle it
  for (const provider of providers) {
    const result = await provider.handleCall(name, args);
    if (result !== null) {
      return result; // The provider successfully handled it!
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// ==========================================
// 4. START SERVER (Stdio Transport)
// ==========================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("[Cortex] MCP Server successfully running on stdio transport.");
}

process.on('SIGINT', () => {
  console.error("[Cortex] Shutting down. Flushing Config...");
  configLoader.saveToDisk();
  process.exit(0);
});

main().catch((error) => {
  console.error("[Cortex] Fatal error running server:", error);
  process.exit(1);
});
