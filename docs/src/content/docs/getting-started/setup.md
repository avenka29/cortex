---
title: Setup
description: How to install and run Cortex as an MCP server.
---

Cortex is completely zero-config and runs locally in your project via NPM. It exposes a dual-engine brain (Vector Search + Topological Graph) to your AI coding assistants.

### Claude

To install Cortex inside Claude, simply run this command in your terminal:

```bash title="Terminal"
claude mcp add cortex -- npx -y cortex-kb
```

### Antigravity (AGY)

To install the Cortex MCP server in your Antigravity environment, run:

```bash title="Terminal"
agy mcp install cortex npx -y cortex-kb
```

### Cursor

To install Cortex inside Cursor, simply run this command:

```bash title="Terminal"
cursor mcp add cortex -- npx -y cortex-kb
```

### Codex

To install the Cortex MCP server for Codex, run:

```bash title="Terminal"
codex mcp add cortex -- npx -y cortex-kb
```

### Human CLI Usage

Cortex also includes a CLI wrapper that human engineers can use directly in the terminal:

```bash title="Terminal"
# Initialize the .cortex/ database config
npx cortex-kb init

# Perform a semantic search on your documentation
npx cortex-kb query "auth logic"

# Generate a 3D HTML architecture graph
npx cortex-kb visualize
```
