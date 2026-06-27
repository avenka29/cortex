# Cortex MCP

Cortex is an advanced Model Context Protocol (MCP) server that supercharges your AI assistant with **Domain-Driven Design Topology** and **Vector Mathematics**.

It is designed to solve the two biggest problems with AI coding assistants:
1. They hallucinate architectural boundaries (e.g. telling your frontend to query your database directly).
2. They get lost in large codebases due to context limits.

Cortex acts as a localized brain for your repository, mapping your codebase into a strict Topological Graph, and cross-referencing it with a native SQLite Vector Database.

## Installation

Cortex is completely zero-config and runs locally in your project via NPM.

### Claude Desktop
Add this to your `claude_desktop_config.json`:
```json
"cortex": {
  "command": "npx",
  "args": ["-y", "cortex-mcp"]
}
```

### Antigravity (AGY)
```bash
agy mcp install cortex npx -y cortex-mcp
```

## Features

### 1. The Topological Graph
Cortex enforces strict Domain-Driven Design rules. The AI can map entities (like `Service`, `DatabaseTable`, `Controller`) and link them with directed edges (`DEPENDS_ON`, `QUERIES`). The ontology is strictly enforced.

### 2. The Local Vector Engine
Cortex embeds a local instance of Transformers.js (`Xenova/all-MiniLM-L6-v2`) and the lightning-fast `sqlite-vec` extension. The AI can bulk-index your markdown documentation (`.md`, `.mdx`), allowing it to semantically search your knowledge base via natural language without wasting context windows.

### 3. The Cross-Reference Link
The two engines talk to each other. When the AI performs a semantic search, Cortex cross-references the Vector Engine with the Topological Graph to instantly tell the AI which architectural component owns the documentation.

## The CLI Wrapper
Cortex isn't just for AI. Human engineers can use the built-in CLI:

- `npx cortex-mcp visualize`: Generates a beautiful, interactive 3D force-directed HTML graph of your software architecture.
- `npx cortex-mcp query "auth logic"`: Performs a lightning-fast natural language semantic search across your codebase directly from your terminal.
- `npx cortex-mcp init`: Bootstraps the `.cortex/` configuration directory.

## Getting Started
Just open a chat with your AI and say:
> *"Cortex, please use index_directory to ingest my markdown documentation, and then map my database tables into the graph."*

## License
MIT