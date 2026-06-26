# Cortex: The AI Operating System

Cortex is an advanced **Hybrid Memory and Diagnostic Engine** designed as a Model Context Protocol (MCP) server. It elevates standard coding AI agents from simple chat bots into autonomous, senior-level engineering partners by providing them with persistent memory and active diagnostic tools.

To prevent the "slopification" of AI memory, Cortex utilizes a strict, project-scoped ontology and a 4-tiered architecture.

## The 4 Pillars of Cortex

### 1. The Graph Engine (The "What" and "Where")
Models strict, deterministic relationships (e.g., SQL schemas, API request chains, Component trees). It allows the AI to traverse "Nodes" and "Edges" to understand the exact architecture and blast radius of any code change, preventing breakages.

### 2. The Vector Store (The "Why")
Stores unstructured concepts, design decisions, and large code snippets for semantic mathematical search. When the AI needs historical context on why a specific hack or architectural choice was made, it searches the vectors.

### 3. Core Memory (The "How")
Maintains global, absolute rules and directives (e.g., "Always use Tailwind", "Never use `any` in TypeScript"). This is injected into the AI's context unconditionally, ensuring it never forgets your coding standards.

### 4. The Diagnostic Engine (Active Debugging)
Cortex acts as both a bridge and a vault for runtime errors:
*   **Live Log Bridge:** Provides tools for the AI to run `grep` searches against your live local server logs to diagnose active crashes autonomously.
*   **Post-Mortem Vault:** Once the AI fixes a bug, it permanently saves the stack trace and the solution into the Knowledge Base so it never has to solve the exact same crash twice.

## Architecture & Configuration
- **Language:** TypeScript (ESM)
- **Protocol:** Official Model Context Protocol (MCP)
- **Storage:** SQLite (`better-sqlite3`) for robust disk persistence, loaded into `O(1)` memory Maps for lightning-fast traversal.
- **Schema-Driven:** The entire graph is configurable. Users define their own allowed Entity Types and Relations in a project-scoped `.cortex/config.json` file. The MCP server dynamically enforces this ontology, completely preventing the AI from creating unstructured garbage.

## Codebase Structure
Cortex is built using a strict **Domain-Driven Design**. The Engines and Database are completely decoupled from the AI/MCP protocol.

```text
cortex/
└── src/
    ├── graph/             # Topology maps & relationship traversal
    ├── vector/            # Inference (embeddings generation) & cosine similarity
    ├── diagnostic/        # Log tailing, grep search, and post-mortems
    ├── core/              # Loads .cortex/config.json & global rules
    ├── db/                # The shared SQLite vault for all domains
    └── mcp/               # AI Protocol Layer (Server & Tool Handlers)
```