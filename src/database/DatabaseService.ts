import Database from 'better-sqlite3';
import path from 'path';
import fs from 'node:fs';
import { Entity, Edge } from '../graph/GraphService.js';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Store it inside the .cortex/ project folder by default
    const resolvedPath = dbPath || path.resolve(process.cwd(), '.cortex', 'knowledge_graph.db');
    this.db = new Database(resolvedPath);
    this.initializeSchema();
  }

  /**
   * Automatically executes all .sql files inside the schemas/ directory
   */
  private initializeSchema() {
    try {
      const schemasDir = path.resolve(process.cwd(), 'src', 'database', 'schemas');
      
      const files = fs.readdirSync(schemasDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(path.join(schemasDir, file), 'utf-8');
          this.db.exec(sql);
        }
      }
      
      console.log(`[DatabaseService] Successfully loaded ${files.length} schema files into ${this.db.name}`);
    } catch (err) {
      console.error(`[DatabaseService] FATAL ERROR: Failed to load schemas`, err);
      throw err;
    }
  }

  // ==========================================
  // GRAPH ENGINE: Read Operations
  // ==========================================

  public getAllEntities(): Entity[] {
    // LAZY LOAD: We intentionally exclude 'content' to keep the startup memory footprint tiny
    return this.db.prepare("SELECT name, entityType FROM nodes").all() as Entity[];
  }

  public getAllEdges(): Edge[] {
    return this.db.prepare("SELECT source, target, edgeType FROM edges").all() as Edge[];
  }

  public getEntityContent(name: string): string | null {
    // Fetches the heavy Markdown payload only when explicitly requested by the AI
    const row = this.db.prepare("SELECT content FROM nodes WHERE name = ?").get(name) as { content: string } | undefined;
    return row ? row.content : null;
  }

  // ==========================================
  // GRAPH ENGINE: Write Operations
  // ==========================================

  public upsertEntity(entity: Entity, content: string = "") {
    const stmt = this.db.prepare("INSERT OR REPLACE INTO nodes (name, entityType, content) VALUES (?, ?, ?)");
    stmt.run(entity.name, entity.entityType, content);
  }

  public addEdge(edge: Edge) {
    const stmt = this.db.prepare("INSERT OR IGNORE INTO edges (source, target, edgeType) VALUES (?, ?, ?)");
    stmt.run(edge.source, edge.target, edge.edgeType);
  }
}
