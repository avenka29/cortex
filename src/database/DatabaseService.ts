import Database from 'better-sqlite3';
import path from 'path';
import { GraphNode, GraphEdge } from '../graph/service.js';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Store it inside the .cortex/ project folder by default
    const resolvedPath = dbPath || path.resolve(process.cwd(), '.cortex', 'knowledge_graph.db');
    this.db = new Database(resolvedPath);
    this.initializeSchema();
  }

  /**
   * Creates the required tables for all 4 Cortex Pillars
   */
  private initializeSchema() {
    this.db.exec(`
      -- 1. GRAPH ENGINE TABLES
      CREATE TABLE IF NOT EXISTS nodes (
        name TEXT PRIMARY KEY,
        nodeType TEXT,
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

      -- 2. VECTOR ENGINE TABLES (Stub for later)
      -- CREATE TABLE IF NOT EXISTS vectors ( node_name TEXT, embedding BLOB ... )

      -- 3. DIAGNOSTIC ENGINE TABLES (Stub for later)
      -- CREATE TABLE IF NOT EXISTS post_mortems ( error_hash TEXT, solution TEXT ... )
    `);
    console.log(`[DatabaseService] SQLite schema initialized at ${this.db.name}`);
  }

  // ==========================================
  // GRAPH ENGINE: Read Operations
  // ==========================================

  public getAllNodes(): GraphNode[] {
    // LAZY LOAD: We intentionally exclude 'content' to keep the startup memory footprint tiny
    return this.db.prepare("SELECT name, nodeType FROM nodes").all() as GraphNode[];
  }

  public getAllEdges(): GraphEdge[] {
    return this.db.prepare("SELECT source, target, edgeType FROM edges").all() as GraphEdge[];
  }

  public getNodeContent(name: string): string | null {
    // Fetches the heavy Markdown payload only when explicitly requested by the AI
    const row = this.db.prepare("SELECT content FROM nodes WHERE name = ?").get(name) as { content: string } | undefined;
    return row ? row.content : null;
  }

  // ==========================================
  // GRAPH ENGINE: Write Operations
  // ==========================================

  public upsertNode(node: GraphNode, content: string = "") {
    const stmt = this.db.prepare("INSERT OR REPLACE INTO nodes (name, nodeType, content) VALUES (?, ?, ?)");
    stmt.run(node.name, node.nodeType, content);
  }

  public addEdge(edge: GraphEdge) {
    const stmt = this.db.prepare("INSERT OR IGNORE INTO edges (source, target, edgeType) VALUES (?, ?, ?)");
    stmt.run(edge.source, edge.target, edge.edgeType);
  }
}
