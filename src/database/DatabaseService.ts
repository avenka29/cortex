import Database from 'better-sqlite3';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import * as sqliteVec from 'sqlite-vec';
import { Entity, Edge } from '../graph/GraphService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Store it inside the .cortex/ project folder by default
    const resolvedPath = dbPath || path.resolve(process.cwd(), '.cortex', 'knowledge_graph.db');
    this.db = new Database(resolvedPath);
    
    // Load the native pre-compiled C++ sqlite-vec extension into the active database connection
    this.db.loadExtension(sqliteVec.getLoadablePath());
    
    this.initializeSchema();
  }

  /**
   * Automatically executes all .sql files inside the schemas/ directory
   */
  private initializeSchema() {
    try {
      // Resolve relative to THIS file's location, NOT the terminal's execution directory
      const schemasDir = path.resolve(__dirname, '../../src/database/schemas');
      
      const files = fs.readdirSync(schemasDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(path.join(schemasDir, file), 'utf-8');
          this.db.exec(sql);
        }
      }
      
      console.error(`[DatabaseService] Successfully loaded ${files.length} schema files into ${this.db.name}`);
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

  public executeCustomQuery(sql: string): any[] {
    return this.db.prepare(sql).all();
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

  // ==========================================
  // VECTOR ENGINE: Semantic Search Operations
  // ==========================================

  public saveVector(referenceId: string, sourceType: string, chunkIndex: number, content: string, embedding: number[]) {
    // 1. Insert the payload into the Metadata table
    const metaStmt = this.db.prepare("INSERT INTO vector_metadata (reference_id, source_type, chunk_index, content) VALUES (?, ?, ?, ?)");
    const metaResult = metaStmt.run(referenceId, sourceType, chunkIndex, content);
    const metaId = metaResult.lastInsertRowid;

    // 2. Insert the actual 384-dim Float array into the native virtual vector index
    const vecStmt = this.db.prepare("INSERT INTO vector_index (rowid, embedding) VALUES (?, ?)");
    // sqlite-vec expects a typed Float32Array, and better-sqlite3 rowids are BigInts
    vecStmt.run(BigInt(metaId), new Float32Array(embedding));
  }

  /**
   * Deletes all vector chunks associated with a specific file path.
   */
  public deleteVectorsForFile(referenceId: string) {
    const idsToDelete = this.db.prepare(`SELECT rowid FROM vector_metadata WHERE reference_id = ?`).all(referenceId) as {rowid: number | bigint}[];
    if (idsToDelete.length === 0) return;

    const deleteMetadata = this.db.prepare(`DELETE FROM vector_metadata WHERE reference_id = ?`);
    const deleteIndex = this.db.prepare(`DELETE FROM vector_index WHERE rowid = ?`);
    
    const transaction = this.db.transaction(() => {
        deleteMetadata.run(referenceId);
        for (const row of idsToDelete) {
            deleteIndex.run(row.rowid);
        }
    });
    transaction();
  }

  public searchVectors(embedding: number[], limit: number = 5, threshold: number = 0.5, sourceTypes?: string[]) {
    // We execute an insanely fast SQL join across the Virtual Index and the Metadata table
    let sql = `
      SELECT m.reference_id, m.source_type, m.content, vec_distance_L2(v.embedding, ?) as distance
      FROM vector_index v
      JOIN vector_metadata m ON v.rowid = m.id
      WHERE vec_distance_L2(v.embedding, ?) < ?
    `;
    
    const params: any[] = [
      new Float32Array(embedding), 
      new Float32Array(embedding), 
      threshold
    ];

    // Optional Filter: Only search CODE, or only search MARKDOWN
    if (sourceTypes && sourceTypes.length > 0) {
      const placeholders = sourceTypes.map(() => '?').join(',');
      sql += ` AND m.source_type IN (${placeholders})`;
      params.push(...sourceTypes);
    }

    sql += ` ORDER BY distance LIMIT ?`;
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as any[];
    
    // Cross-reference with Topological Graph
    return rows.map(row => ({
      ...row,
      associated_entities: this.getAssociatedEntitiesForFile(row.reference_id)
    }));
  }

  /**
   * Scans the Topological Graph to see if any Entity explicitly tracks this file.
   */
  public getAssociatedEntitiesForFile(filePath: string): string[] {
    const sql = `SELECT name FROM nodes WHERE content LIKE ?`;
    const results = this.db.prepare(sql).all(`%${filePath}%`) as any[];
    return results.map(r => r.name);
  }
}
