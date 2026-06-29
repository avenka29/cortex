---
title: Examples
description: Example prompts to use with Cortex.
---

Once Cortex is connected to your AI, try pasting these prompts into your chat to see the system in action:

### Bootstrapping the Brain

```text
> Cortex, please ingest all the markdown documentation 
  in my `/docs` folder, and then analyze my `src/` 
  folder to map my core services into the topological 
  graph.
```

### Architectural Investigation

```text
> Before we write any code, use Cortex to find the 
  `PaymentController` in the graph. I need to know 
  exactly which services it depends on so we don't 
  violate our Domain-Driven Design rules.
```

### Blast Radius Analysis

```text
> I need to refactor the `DatabaseService`. Can you 
  use Cortex to determine the blast radius and list 
  every single component that will break if I change 
  the methods in this service?
```

### Semantic Lookup

```text
> I forgot how we configure the caching layer. Can you 
  use Cortex to search our documentation for 'Redis 
  caching configuration' and find the exact setup steps?
```
