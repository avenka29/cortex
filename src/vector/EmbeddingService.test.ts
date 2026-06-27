import { describe, it, expect, vi } from 'vitest';
import { EmbeddingService } from './EmbeddingService.js';

// Mock Transformers.js so it doesn't download 20MB of neural network during tests!
vi.mock('@xenova/transformers', () => {
  return {
    pipeline: vi.fn().mockResolvedValue(async (text: string, options: any) => {
      // Return a fake Tensor object containing 384 dimensions
      return {
        data: new Float32Array(384).fill(0.5) 
      };
    })
  };
});

describe('EmbeddingService', () => {
  it('should initialize and generate a 384-dimensional embedding', async () => {
    const service = new EmbeddingService();
    
    // Generate the embedding
    const vector = await service.generateEmbedding('test code snippet');
    
    // Assertions
    expect(vector.length).toBe(384);
    // Verify it used our mocked data correctly
    expect(vector[0]).toBe(0.5); 
  });
});
