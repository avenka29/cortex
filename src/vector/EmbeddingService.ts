import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

export class EmbeddingService {
  private extractor: FeatureExtractionPipeline | null = null;
  // all-MiniLM-L6-v2 is a blazing fast 384-dimensional model perfect for code chunks
  private modelName = 'Xenova/all-MiniLM-L6-v2';

  /**
   * Lazy-loads the embedding model into RAM on the first call.
   * If it's the first time ever running, it downloads a tiny 20MB file to the cache.
   */
  public async initialize(): Promise<void> {
    if (!this.extractor) {
      console.error(`[EmbeddingService] Loading local embedding model: ${this.modelName}...`);
      
      // We use int8 quantization for lightning-fast CPU inference and low memory footprint
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        quantized: true,
      }) as FeatureExtractionPipeline;
      
      console.error(`[EmbeddingService] Embedding model loaded into memory.`);
    }
  }

  /**
   * Converts raw text (like a code snippet) into a mathematical vector array.
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    await this.initialize();
    
    if (!this.extractor) {
      throw new Error("Embedding model failed to initialize.");
    }

    // Generate the embedding using Mean pooling and L2 normalization (Standard for sentence-transformers)
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    
    // Convert the resulting Tensor data into a standard JavaScript array of floats
    return Array.from(output.data);
  }
}
