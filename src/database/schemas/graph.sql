CREATE TABLE IF NOT EXISTS nodes (
  name TEXT PRIMARY KEY,
  entityType TEXT,
  content TEXT -- The rich markdown context for the AI
);

CREATE TABLE IF NOT EXISTS edges (
  source TEXT,
  target TEXT,
  edgeType TEXT,
  PRIMARY KEY (source, target, edgeType),
  FOREIGN KEY(source) REFERENCES nodes(name),
  FOREIGN KEY(target) REFERENCES nodes(name)
);
