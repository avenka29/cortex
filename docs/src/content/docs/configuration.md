---
title: Configuration & Ontology
description: How Cortex strictly enforces Domain-Driven Design using config.json.
---

When Cortex boots up in your repository for the first time, it auto-generates a `.cortex/config.json` file. This file is the lifeblood of your architectural integrity.

## The Default Ontology
By default, Cortex ships with a strict, baseline software architecture:

```json
{
  "allowedEntityTypes": [
    "FrontendComponent",
    "BackendController",
    "Service",
    "DatabaseTable",
    "ExternalAPI"
  ],
  "allowedEdgeTypes": [
    "DEPENDS_ON",
    "CALLS",
    "QUERIES"
  ],
  "allowedRelations": [
    { "source": "FrontendComponent", "target": "BackendController", "edgeType": "CALLS" },
    { "source": "BackendController", "target": "Service", "edgeType": "DEPENDS_ON" },
    { "source": "Service", "target": "DatabaseTable", "edgeType": "QUERIES" }
  ]
}
```

## Why is this necessary?
AI coding assistants are notorious for taking shortcuts. If you ask an AI to "add a feature that shows the user's balance on the dashboard", a naive AI might write a SQL query directly inside the React `Dashboard.tsx` file.

Cortex blocks this. 

If the AI attempts to call `add_edge` linking a `FrontendComponent` to a `DatabaseTable`, the Cortex server will instantly intercept the request, parse the `allowedRelations` matrix in your `config.json`, and return an error to the AI:
> *"Error: Edge from FrontendComponent to DatabaseTable is not allowed."*

This forces the AI to stop, think, and correctly route the logic through a `BackendController` and a `Service`.

## Expanding the Ontology
If your architecture requires custom nodes (e.g., `RedisCache`, `MessageQueue`, `GraphQLResolver`), you can:
1. Manually edit `.cortex/config.json` yourself.
2. Ask the AI to use the `expand_ontology` MCP tool to gracefully add new node types to the configuration.
