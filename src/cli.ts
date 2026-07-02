#!/usr/bin/env node

import { DatabaseService } from "./database/DatabaseService.js";
import { ConfigLoader } from "./core/ConfigLoader.js";
import { GraphService } from "./graph/GraphService.js";
import { EmbeddingService } from "./vector/EmbeddingService.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GraphToolProvider } from "./mcp/providers/GraphToolProvider.js";
import { VectorToolProvider } from "./mcp/providers/VectorToolProvider.js";
import fs from 'fs';
import path from 'path';

export const PROVIDER_FILES: Record<string, string> = {
    'cursor': '.cursorrules',
    'antigravity': '.agents/AGENTS.md',
    'copilot': '.github/copilot-instructions.md',
    'windsurf': '.windsurfrules'
};

export const CORTEX_INSTRUCTIONS = `
# --- Cortex MCP Instructions ---
You are equipped with Cortex MCP tools. When interacting with this project, 
automatically use the knowledge base (e.g. index_directory, search_entities) 
whenever you see fit to understand the architecture or map new entities.
# -------------------------------
`;

export async function runCLI() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start'; // default to MCP server for backwards compatibility

    if (command === '--help' || command === '-h' || command === 'help') {
        console.log(`
Cortex MCP Knowledge Base CLI

Usage: cortex <command> [options]

Commands:
  start                     Starts the MCP server (Default)
  init [provider|file]      Initializes the knowledge graph and injects AI instructions
                            (e.g., 'cortex init cursor', 'cortex init rules.md')
  index                     Indexes markdown documentation in the current directory
  query <term>              Performs a semantic search against the knowledge base
  visualize                 Generates an HTML visualization of the graph topology

Options:
  -h, --help                Show this help message
        `);
        process.exit(0);
    }

    if (command === 'init') {
        const subCommand = args[1];

        const applyInstructions = (filePath: string) => {
            const absolutePath = path.resolve(process.cwd(), filePath);
            const dir = path.dirname(absolutePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            if (fs.existsSync(absolutePath)) {
                const content = fs.readFileSync(absolutePath, 'utf8');
                if (!content.includes('Cortex MCP Instructions')) {
                    fs.appendFileSync(absolutePath, '\n' + CORTEX_INSTRUCTIONS);
                    console.log(`[Cortex] Appended instructions to existing ${filePath}`);
                } else {
                    console.log(`[Cortex] Instructions already present in ${filePath}`);
                }
            } else {
                fs.writeFileSync(absolutePath, CORTEX_INSTRUCTIONS.trim() + '\n');
                console.log(`[Cortex] Created and added instructions to ${filePath}`);
            }
        };

        if (subCommand) {
            if (PROVIDER_FILES[subCommand]) {
                applyInstructions(PROVIDER_FILES[subCommand]);
            } else if (subCommand.includes('.')) {
                applyInstructions(subCommand);
            } else {
                console.error(`\n[Cortex] ❌ Unknown AI provider: '${subCommand}'`);
                console.error(`Supported providers: ${Object.keys(PROVIDER_FILES).join(', ')}`);
                console.error(`If you meant to specify a custom file, please include a file extension (e.g., 'cortex init custom-rules.md').\n`);
                process.exit(1);
            }
        } else {
            let found = false;
            for (const file of Object.values(PROVIDER_FILES)) {
                if (fs.existsSync(path.resolve(process.cwd(), file))) {
                    applyInstructions(file);
                    found = true;
                }
            }
            if (!found) {
                applyInstructions('cortex-instructions.md');
            }
        }

        console.log("[Cortex] Initialized successfully.");
        process.exit(0);
    } 

    const configLoader = new ConfigLoader();
    configLoader.loadConfig();

    const database = new DatabaseService();
    const graphService = new GraphService(database, configLoader);
    graphService.loadGraph();

    if (command === 'query') {
        const query = args.slice(1).join(" ");
        if (!query) {
            console.error("Please provide a search term. Usage: cortex query <term>");
            process.exit(1);
        }
        console.log(`[Cortex] Semantic Search for: "${query}"...`);
        const embeddingService = new EmbeddingService();
        const vector = await embeddingService.generateEmbedding(query);
        const results = database.searchVectors(vector, 5, 1.0, ['MARKDOWN']);
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    }
    else if (command === 'index') {
        const dir = process.cwd();
        console.log(`[Cortex] Auto-indexing markdown documentation in ${dir}...`);
        const embeddingService = new EmbeddingService();
        const provider = new VectorToolProvider(database, embeddingService);
        const result = await provider.handleCall('index_directory', { directoryPath: dir });
        console.log(`[Cortex] ${result.content[0].text}`);
        process.exit(0);
    }
    else if (command === 'visualize') {
        const nodes = database.getAllEntities();
        const edges = database.getAllEdges();
        
        // Transform the graph into the format expected by vis-network (a beautiful, zero-dependency CDN library)
        const visNodes = nodes.map(n => ({ 
            id: n.name, 
            label: n.name, 
            group: n.entityType 
        }));
        
        const visEdges = edges.map(e => ({ 
            from: e.source, 
            to: e.target, 
            label: e.edgeType, 
            arrows: "to" 
        }));

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Cortex Architecture Graph</title>
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style type="text/css">
        body { margin: 0; padding: 0; overflow: hidden; background-color: #0f172a; font-family: 'Inter', sans-serif; }
        #mynetwork {
            width: 100vw;
            height: 100vh;
        }
        #header {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            z-index: 10;
        }
        h1 { margin: 0; font-size: 24px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        p { margin: 5px 0 0 0; font-size: 14px; color: #94a3b8; }
    </style>
</head>
<body>
<div id="header">
    <h1>Cortex Topology</h1>
    <p>Auto-generated from your local SQLite Graph</p>
</div>
<div id="mynetwork"></div>
<script type="text/javascript">
    const nodes = new vis.DataSet(${JSON.stringify(visNodes)});
    const edges = new vis.DataSet(${JSON.stringify(visEdges)});
    const container = document.getElementById('mynetwork');
    const data = { nodes: nodes, edges: edges };
    
    // Premium Dark Mode Styling
    const options = {
        nodes: {
            shape: 'box',
            margin: 10,
            font: { color: 'white', face: 'monospace', size: 14 },
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 0, y: 5 },
            color: {
                background: '#1e293b',
                border: '#3b82f6',
                highlight: { background: '#3b82f6', border: '#60a5fa' }
            }
        },
        edges: {
            font: { color: '#94a3b8', align: 'middle', size: 12, face: 'sans-serif' },
            color: { color: '#475569', highlight: '#94a3b8' },
            smooth: { type: 'cubicBezier' },
            width: 2
        },
        physics: {
            barnesHut: { gravitationalConstant: -4000, centralGravity: 0.3, springLength: 200 }
        }
    };
    
    const network = new vis.Network(container, data, options);
</script>
</body>
</html>`;
        
        const outPath = path.join(process.cwd(), '.cortex', 'graph.html');
        fs.writeFileSync(outPath, html);
        console.log(`[Cortex] Visualization generated at: ${outPath}`);
        console.log(`Open this file in your web browser to view the graph.`);
        process.exit(0);
    }
    else if (command === 'start') {
        const embeddingService = new EmbeddingService();
        const providers = [
            new GraphToolProvider(graphService, database, configLoader),
            new VectorToolProvider(database, embeddingService)
        ];

        const server = new Server({ name: "cortex-mcp-server", version: "1.0.0" }, { capabilities: { tools: {} } });

        server.setRequestHandler(ListToolsRequestSchema, async () => {
            return { tools: providers.flatMap(p => p.getDefinitions()) };
        });

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            for (const provider of providers) {
                const result = await provider.handleCall(name, args);
                if (result !== null) return result;
            }
            throw new Error(`Unknown tool: ${name}`);
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);
        // Important: stdout is reserved for MCP communication. Only log to stderr.
        console.error("[Cortex] MCP Server successfully running on stdio transport.");
    }
    else {
        console.error(`\n[Cortex] ❌ Unknown command: '${command}'`);
        console.error(`Run 'cortex --help' to see a list of available commands.\n`);
        process.exit(1);
    }
}

// Only auto-run if this file is the main entry point (not imported in a test)
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js') || process.argv[1].includes('.bin'))) {
    runCLI().catch(e => {
        console.error("[Cortex] Fatal error:", e);
        process.exit(1);
    });
}
