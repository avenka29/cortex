---
title: The Cortex Architecture
description: A deep dive into the dual-engine architecture powering Cortex.
---

Cortex solves the two biggest problems in Agentic AI Coding:
1. **Context Limits:** The AI can't read 500 files at once.
2. **Architectural Hallucinations:** The AI builds features that violate Domain-Driven Design (DDD) boundaries (e.g. telling a React component to query a PostgreSQL database).

To solve this, Cortex splits knowledge into two distinct, communicating engines.

---

## 1. The Topological Graph Engine
The graph is designed for **Deterministic Code Topology**. It enforces strict, rigid boundaries using Nodes and Directed Edges.

- **Nodes (Entities):** Represent hard architectural components (e.g., `UserService`, `AuthTable`, `LoginButton`).
- **Edges:** Represent relationships (e.g., `DEPENDS_ON`, `QUERIES`, `IMPLEMENTS`).

Because this graph is powered by SQLite, the AI can run a `get_blast_radius` query. If the AI wants to modify the `AuthTable`, the Graph instantly recursively traverses the tree to tell the AI that `UserService` and `LoginButton` will be impacted and must be refactored. 

Crucially, **the Graph enforces Ontology**. The AI cannot invent fake relationships. If your `.cortex/config.json` says a `FrontendComponent` is not allowed to have a `QUERIES` edge to a `DatabaseTable`, Cortex will block the AI from mapping it.

---

## 2. The Vector Math Engine
The vector engine is designed for **Fluid Human Knowledge**. 

While the Graph handles code boundaries, the Vector Engine handles your `.md` and `.mdx` documentation. 
Cortex embeds `Xenova/all-MiniLM-L6-v2` directly into the Node.js process and pairs it with `sqlite-vec`. 

When the AI calls `index_directory`, Cortex walks your workspace, chunks your markdown files, generates 384-dimensional embeddings, and saves them. This means the AI can search for *"how do we validate passwords?"* and instantly retrieve the exact paragraph from an RFC you wrote 6 months ago.

---

## 3. The Cross-Engine Link
This is the magic of Cortex. The Vector Engine and the Topological Graph talk to each other.

When the AI performs a semantic search on your documentation, Cortex's Database Layer runs a rapid `LIKE` query across the `nodes` table in the Graph. 

The returned JSON doesn't just contain the markdown chunk; it automatically attaches an `associated_entities: []` array. **The AI instantly knows exactly which Architectural Node owns the documentation it just read**, allowing it to seamlessly pipe that Entity Name into `get_blast_radius`!
