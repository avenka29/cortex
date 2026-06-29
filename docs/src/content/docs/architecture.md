---
title: Architecture
description: Understanding the Cortex dual-engine brain.
---

Cortex is built on a "Dual-Engine" architecture that enforces **Domain-Driven Design (DDD)** while providing massive context via **Vector Search**.

## The Problem
Modern AI coding assistants suffer from two major flaws:
1. **Hallucination of Boundaries:** They will happily tell a frontend component to query a database directly, violating architectural layers.
2. **Context Loss:** Large codebases do not fit in context windows, causing the AI to forget critical documentation.

## The Cortex Solution

### 1. The Topological Graph Engine
The graph engine acts as the strict enforcer of Domain-Driven Design. It maps:
- **Nodes**: Entities in your codebase (e.g. `Controller`, `Service`, `Repository`).
- **Edges**: Directed relationships (e.g. `DEPENDS_ON`, `QUERIES`).

By strictly defining the ontology, the AI can query the graph and instantly know *what is allowed to talk to what*.

### 2. The Local Vector Engine
Cortex embeds a local version of `Transformers.js` (using `Xenova/all-MiniLM-L6-v2`) and leverages the lightning-fast `sqlite-vec` extension for SQLite.

Instead of embedding raw code, Cortex bulk-indexes your **Markdown Documentation**. When the AI needs context, it performs a natural language semantic search against your `.md` files without ever leaving your machine.

### 3. Cross-Engine Referencing
The real power of Cortex is when the two engines communicate. When the AI reads documentation from the Vector Database, Cortex cross-references the file path with the Topological Graph to instantly identify which architectural component owns that documentation!
