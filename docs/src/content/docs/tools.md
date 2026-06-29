---
title: MCP Tools
description: Full reference of all tools exposed by the Cortex Server.
---

When connected to an AI Assistant, Cortex exposes the following tools directly to the LLM.

## Graph Tools

### `add_entity`
Maps a new architectural node into the topological graph.
- **Parameters:** `name` (string), `entityType` (string), `description` (string), `filePaths` (array).
- *Throws an error if the `entityType` is not allowed by the ontology.*

### `add_edge`
Connects two existing entities with a directed edge.
- **Parameters:** `source` (string), `target` (string), `edgeType` (string).
- *Throws an error if the relationship violates the ontology matrix.*

### `get_blast_radius`
Calculates the recursive dependencies of a specific entity. Used by the AI to determine what files it needs to read before modifying a core piece of architecture.
- **Parameters:** `entityName` (string).

### `search_entities`
Searches the database for valid entity names. Essential for the AI to find the exact case-sensitive name of a node before running a Blast Radius calculation.
- **Parameters:** `query` (optional string).

### `expand_ontology`
Allows the AI to dynamically request permission to add a new `entityType` or `edgeType` to the `.cortex/config.json` strict ontology list.
- **Parameters:** `category` (string: "entity" | "edge"), `newType` (string).

---

## Vector Tools

### `index_directory`
Recursively walks the user's workspace, ignores `node_modules` and `.git`, and chunks all `.md` and `.mdx` files. It wipes old vectors for those files (Idempotent), generates neural embeddings, and bulk-saves them to SQLite.
- **Parameters:** `directoryPath` (string).

### `index_file`
Chunks and vectorizes a single markdown file.
- **Parameters:** `filePath` (string).

### `semantic_search`
Queries the local Vector Database for documentation matching a natural language string. The output automatically cross-references the Topological Graph to return associated architectural entities.
- **Parameters:** `query` (string), `limit` (number), `threshold` (number).
