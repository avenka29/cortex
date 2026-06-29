---
title: Configuration
description: How to configure the Cortex workspace.
---

Cortex is designed to be completely zero-config out of the box. However, it stores all of its state in a hidden folder inside your project.

## The `.cortex` Directory

When Cortex initializes (via the AI or the `npx cortex-kb init` CLI command), it creates a `.cortex` directory in the root of your workspace.

```text
.cortex/
├── config.json
├── knowledge_graph.db
└── graph.html
```

### `config.json`
Stores workspace-specific configuration (like which paths to ignore during indexing).

### `knowledge_graph.db`
This is the unified SQLite database. It contains:
- Standard SQL tables for the **Topological Graph** (`entities`, `edges`).
- Virtual tables (`vec0`) for the **Vector Database**.

*Note: You should add `.cortex/` to your `.gitignore` to prevent committing the database to your remote repository.*
