---
title: Getting Started
description: How to install and run Cortex as an MCP server.
---

Cortex is completely zero-config and runs locally in your project via NPM. It exposes a dual-engine brain (Vector Search + Topological Graph) to your AI coding assistants.

## 1. Quick Start (Claude Desktop)

To install Cortex inside Claude Desktop, simply run this command in your terminal:

```bash
claude mcp add cortex -- npx -y cortex-kb
```

## 2. Antigravity (AGY)

To install the Cortex MCP server in your Antigravity environment, run:

```bash
agy mcp install cortex npx -y cortex-kb
```

## 3. Human CLI Usage

Cortex also includes a CLI wrapper that human engineers can use directly in the terminal!

```bash
# Initialize the .cortex/ database config
npx cortex-kb init

# Perform a semantic search on your documentation
npx cortex-kb query "auth logic"

# Generate a 3D HTML architecture graph
npx cortex-kb visualize
```

## What's Next?

Once Cortex is running, ask your AI assistant to run `index_directory` on your documentation folders!
