import { ToolProvider } from './ToolProvider.js';
import { DatabaseService } from '../../database/DatabaseService.js';
import { EmbeddingService } from '../../vector/EmbeddingService.js';
import fs from 'fs';

export class VectorToolProvider implements ToolProvider {
    constructor(
        private database: DatabaseService,
        private embeddingService: EmbeddingService
    ) {}

    public getDefinitions(): any[] {
        return [
            {
                name: "index_file",
                description: "Reads a raw source code file from disk, chunks it, and generates vector embeddings to make it semantically searchable.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: { type: "string", description: "Absolute path to the file to index." },
                        sourceType: { type: "string", description: "Either 'CODE' or 'MARKDOWN'." }
                    },
                    required: ["filePath", "sourceType"]
                }
            },
            {
                name: "semantic_search",
                description: "Searches the vector database for code or markdown snippets matching the natural language query.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "The natural language search query (e.g., 'auth logic')." },
                        limit: { type: "number", description: "Max results to return (default 5)." },
                        threshold: { type: "number", description: "Distance threshold. Lower is stricter. (default 1.0)." },
                        sourceTypes: { 
                            type: "array", 
                            items: { type: "string" },
                            description: "Filter by source types, e.g., ['CODE'] or ['MARKDOWN']" 
                        }
                    },
                    required: ["query"]
                }
            }
        ];
    }

    public async handleCall(name: string, args: any): Promise<any | null> {
        try {
            if (name === "index_file") {
                const { filePath, sourceType } = args;
                
                if (!fs.existsSync(filePath)) {
                    return { isError: true, content: [{ type: "text", text: `Error: File not found at ${filePath}` }] };
                }

                const content = fs.readFileSync(filePath, 'utf-8');
                
                // Simple line-based chunking (~1000 characters per chunk)
                const chunks = this.chunkText(content, 1000);
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    if (chunk.trim() === '') continue;
                    
                    const embedding = await this.embeddingService.generateEmbedding(chunk);
                    this.database.saveVector(filePath, sourceType, i, chunk, embedding);
                }

                return { content: [{ type: "text", text: `Successfully indexed ${chunks.length} chunks from ${filePath}` }] };
            }

            if (name === "semantic_search") {
                const { query, limit = 5, threshold = 1.0, sourceTypes } = args;
                
                const embedding = await this.embeddingService.generateEmbedding(query);
                const results = this.database.searchVectors(embedding, limit, threshold, sourceTypes);

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(results, null, 2)
                    }]
                };
            }

            return null;
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Error in VectorToolProvider: ${error.message}` }],
                isError: true
            };
        }
    }

    private chunkText(text: string, maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = "";
        
        const lines = text.split('\n');
        for (const line of lines) {
            if ((currentChunk.length + line.length) > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = "";
            }
            currentChunk += line + '\n';
        }
        
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }
}
