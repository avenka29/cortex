---
title: Getting Started
description: How to install and run Cortex as an MCP server.
---

Cortex is completely zero-config and runs locally in your project via NPM. It exposes a dual-engine brain (Vector Search + Topological Graph) to your AI coding assistants.

## Quick Start (Claude)

To install Cortex inside Claude, simply run this command in your terminal:

```bash
claude mcp add cortex -- npx -y cortex-kb
```

## Antigravity (AGY)

To install the Cortex MCP server in your Antigravity environment, run:

```bash
agy mcp install cortex npx -y cortex-kb
```

## Human CLI Usage

Cortex also includes a CLI wrapper that human engineers can use directly in the terminal:

```bash
# Initialize the .cortex/ database config
npx cortex-kb init

# Perform a semantic search on your documentation
npx cortex-kb query "auth logic"

# Generate a 3D HTML architecture graph
npx cortex-kb visualize
```

---

## Example Scenarios

Once Cortex is connected to your AI, try pasting these prompts into your chat to see the system in action:

### Bootstrapping the Brain

```text
> Cortex, please ingest all the markdown documentation in my `/docs` folder, and then analyze my `src/` folder to map my core services into the topological graph.
```

### Architectural Investigation

```text
> Before we write any code, use Cortex to find the `PaymentController` in the graph. I need to know exactly which services it depends on so we don't violate our Domain-Driven Design rules.
```

### Blast Radius Analysis

```text
> I need to refactor the `DatabaseService`. Can you use Cortex to determine the blast radius and list every single component that will break if I change the methods in this service?
```

### Semantic Lookup

```text
> I forgot how we configure the caching layer. Can you use Cortex to search our documentation for 'Redis caching configuration' and find the exact setup steps?
```
