import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorToolProvider } from './VectorToolProvider.js';
import { DatabaseService } from '../../database/DatabaseService.js';
import { EmbeddingService } from '../../vector/EmbeddingService.js';
import fs from 'fs';

// Mock the file system so we don't try to read real files during unit tests
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  }
}));

describe('VectorToolProvider', () => {
  let provider: VectorToolProvider;
  let mockDb: any;
  let mockEmbeddingService: any;

  beforeEach(() => {
    // We mock the database to just return a dummy result instead of hitting SQLite
    mockDb = {
      saveVector: vi.fn(),
      searchVectors: vi.fn().mockReturnValue([{ reference_id: 'mock.ts', content: 'mock content' }]),
      deleteVectorsForFile: vi.fn()
    };

    // We mock the embedding service so it doesn't trigger a 20MB neural network download
    mockEmbeddingService = {
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
    };

    provider = new VectorToolProvider(
        mockDb as unknown as DatabaseService, 
        mockEmbeddingService as unknown as EmbeddingService
    );
  });

  it('should get definitions for three tools', () => {
    const defs = provider.getDefinitions();
    expect(defs.length).toBe(3);
    expect(defs.map(d => d.name)).toEqual(expect.arrayContaining(['index_file', 'index_directory', 'semantic_search']));
  });

  it('should execute semantic_search correctly', async () => {
    const result = await provider.handleCall('semantic_search', { query: 'test', limit: 5 });
    
    // Verify it called the ML engine and the DB in the correct order
    expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('test');
    expect(mockDb.searchVectors).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5, 1.0, ['MARKDOWN']);
    
    // Verify the output matches MCP spec
    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('mock content');
  });

  it('should return error for index_file if file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    const result = await provider.handleCall('index_file', { filePath: 'fake.ts' });
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });

  it('should chunk and index files correctly', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    
    // Create a 1500 char string (simulating lines) to force it to split into multiple chunks
    const bigString = "a".repeat(50) + "\n"; 
    vi.mocked(fs.readFileSync).mockReturnValue(bigString.repeat(30)); // ~1500 chars
    
    const result = await provider.handleCall('index_file', { filePath: 'real.ts' });
    
    expect(result.isError).toBeFalsy();
    // 1500 chars split by ~1000 max size should result in 2 chunks
    expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledTimes(2);
    expect(mockDb.saveVector).toHaveBeenCalledTimes(2);
    expect(result.content[0].text).toContain('2 chunks');
  });
});
