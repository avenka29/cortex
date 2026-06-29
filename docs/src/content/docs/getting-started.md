---
title: Getting Started
description: How to install and run Cortex in your AI Assistant.
---

Cortex is an advanced **Model Context Protocol (MCP)** server. It acts as a headless brain for your AI assistant, allowing it to navigate massive codebases and enforce architectural rules.

## Installation

Because Cortex is distributed via NPM, you don't need to manually clone any repositories or set up databases. It runs entirely locally on your machine.

### For Claude Desktop Users
Add the following snippet to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["-y", "cortex-kb"]
    }
  }
}
```

### For Antigravity (AGY) Users
Run this directly in your terminal:
```bash
agy mcp install cortex npx -y cortex-kb
```

### For Cursor Users
1. Open Cursor Settings -> MCP.
2. Add a new server.
3. Select **Type:** `command`
4. Set **Command:** `npx -y cortex-kb`

---

## Initialization

Cortex features a **Zero-Config Bootstrap**.

When you open your AI assistant inside a codebase (like `~/projects/my-app`), Cortex wakes up. It will automatically detect if the project is missing Cortex files and will instantly create a `.cortex/` folder at the root of your project containing:

1. `config.json` - Your strict ontology rules.
2. `knowledge_graph.db` - The SQLite database holding your graphs and vectors.

Because the database is isolated to your project root, you can use Cortex on 50 different repositories without their architectures bleeding into each other!

## Your First Prompt

Open your AI Chat and say:

> *"Cortex, please use `index_directory` to ingest my markdown documentation, and then use `add_entity` to map my database tables into the graph."*
