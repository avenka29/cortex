---
title: Getting Started
description: How to install and run Cortex as an MCP server.
---

Cortex is completely zero-config and runs locally in your project via NPM. It exposes a dual-engine brain (Vector Search + Topological Graph) to your AI coding assistants.

## 1. Quick Start (Claude)

To install Cortex inside Claude, simply run this command in your terminal:

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

---

## Example Prompts

Once Cortex is connected to your AI, try pasting these prompts into your chat to see the magic happen:

### 🧠 Bootstrapping the Brain
> *"Cortex, please use `index_directory` to ingest all the markdown documentation in my `/docs` folder, and then analyze my `src/` folder to map my core services into the topological graph."*

### 🕵️‍♀️ Architectural Investigation
> *"Before we write any code, use Cortex to find the `PaymentController` in the graph. I need to know exactly which services it `DEPENDS_ON` so we don't violate our Domain-Driven Design rules."*

### 💥 Blast Radius Analysis
> *"I need to refactor the `DatabaseService`. Can you use `get_blast_radius` to list every single component that will break if I change the methods in this service?"*

### 🔍 Semantic Lookup
> *"I forgot how we configure the caching layer. Can you perform a `semantic_search` for 'Redis caching configuration' to find the exact documentation for it?"*
