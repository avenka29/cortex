import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from './DatabaseService.js';
import { Entity, Edge } from '../graph/GraphService.js';

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    // The ':memory:' string tells SQLite to spin up a completely ephemeral RAM database!
    // This is perfect for tests because it guarantees zero disk IO and zero data bleed between tests.
    dbService = new DatabaseService(':memory:');
  });

  it('should successfully upsert and retrieve Entities without loading Markdown content', () => {
    const testEntity: Entity = { name: 'UserTable', entityType: 'DatabaseTable' };
    
    // Upsert with rich text content
    dbService.upsertEntity(testEntity, '# User Table Schema');
    
    // Retrieve metadata only (Lazy Loading verification)
    const entities = dbService.getAllEntities();
    expect(entities.length).toBe(1);
    expect(entities[0].name).toBe('UserTable');
    expect(entities[0].entityType).toBe('DatabaseTable');
    expect((entities[0] as any).content).toBeUndefined(); // Guarantees content is not pulled

    // Retrieve rich text payload on demand
    const content = dbService.getEntityContent('UserTable');
    expect(content).toBe('# User Table Schema');
  });

  it('should insert and retrieve Edges correctly', () => {
    // Our SQLite database has strict FOREIGN KEY constraints.
    // We MUST create the nodes first, otherwise SQLite will block the edge creation!
    dbService.upsertEntity({ name: 'AuthService', entityType: 'Service' });
    dbService.upsertEntity({ name: 'UserTable', entityType: 'DatabaseTable' });

    const testEdge: Edge = { source: 'AuthService', target: 'UserTable', edgeType: 'DEPENDS_ON' };
    
    dbService.addEdge(testEdge);
    
    const edges = dbService.getAllEdges();
    expect(edges.length).toBe(1);
    expect(edges[0].source).toBe('AuthService');
    expect(edges[0].target).toBe('UserTable');
    expect(edges[0].edgeType).toBe('DEPENDS_ON');
  });

  it('should successfully save and search vectors via sqlite-vec', () => {
    // Generate mock 384-dimensional vectors
    const mockVector1 = new Array(384).fill(0);
    mockVector1[0] = 1.0; // Pointing strongly along X axis

    const mockVector2 = new Array(384).fill(0);
    mockVector2[0] = -1.0; // Pointing in exact opposite direction

    // Save them to the database
    dbService.saveVector('src/auth.ts', 'CODE', 0, 'auth logic', mockVector1);
    dbService.saveVector('src/db.ts', 'CODE', 0, 'database connection', mockVector2);

    // Search for a vector extremely close to mockVector1
    const searchVector = new Array(384).fill(0);
    searchVector[0] = 0.9;
    
    // We expect auth.ts to be returned because it's much closer in Euclidean distance (L2)
    const results = dbService.searchVectors(searchVector, 1, 10.0, ['CODE']);
    
    expect(results.length).toBe(1);
    expect(results[0].reference_id).toBe('src/auth.ts');
    expect(results[0].content).toBe('auth logic');
    expect(results[0].source_type).toBe('CODE');
    expect(results[0].distance).toBeLessThan(0.5); // Very close distance
  });

  it('should execute custom SELECT queries successfully', () => {
    dbService.upsertEntity({ name: 'Node1', entityType: 'Service' }, 'content1');
    const results = dbService.executeCustomQuery("SELECT * FROM nodes WHERE name = 'Node1'");
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Node1');
    expect(results[0].content).toBe('content1');
  });
});
