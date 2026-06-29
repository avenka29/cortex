---
title: MCP Tools
description: Tools exposed by Cortex to AI clients.
---

When connected to an AI client (like Claude Desktop) via the Model Context Protocol (MCP), Cortex exposes the following tools:

## Graph Tools

### `add_entity`
Adds a new architectural Node (Component, Service, etc.) to the topological graph.
- **Parameters**: `name`, `type`, `description`, `filePath`.

### `add_edge`
Draws a strictly enforced directed relationship between two entities.
- **Parameters**: `source`, `target`, `relationshipType` (e.g., `DEPENDS_ON`).

### `get_blast_radius`
Given a specific entity, this tool traverses the graph to find all downstream entities that rely on it. Perfect for AI refactoring.

## Vector Tools

### `index_directory`
Recursively scans a directory for markdown (`.md`, `.mdx`) files, calculates vector embeddings using a local Hugging Face model, and bulk-inserts them into the SQLite Vector DB. 
- *Includes idempotency (wipes old vectors for modified files automatically).*

### `semantic_search`
Performs a natural language cosine-similarity search against the local vector database to return the most relevant documentation snippets.
