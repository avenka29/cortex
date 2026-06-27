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
});
