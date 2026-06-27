import { ToolProvider } from './ToolProvider.js';
import { DatabaseService } from '../../database/DatabaseService.js';
import { EmbeddingService } from '../../vector/EmbeddingService.js';
import fs from 'fs';
import path from 'path';

export class VectorToolProvider implements ToolProvider {
    constructor(
        private database: DatabaseService,
        private embeddingService: EmbeddingService
    ) {}

    public getDefinitions(): any[] {
        return [
            {
                name: "index_file",
                description: "Reads a raw markdown documentation file from disk, chunks it, and generates vector embeddings to make it semantically searchable.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: { type: "string", description: "Absolute path to the markdown file to index." }
                    },
                    required: ["filePath"]
                }
            },
            {
                name: "index_directory",
                description: "Recursively walks a directory, chunks all markdown documentation files (.md, .mdx), and generates vector embeddings to make the whole knowledge base searchable.",
                inputSchema: {
                    type: "object",
                    properties: {
                        directoryPath: { type: "string", description: "Absolute path to the directory to index." }
                    },
                    required: ["directoryPath"]
                }
            },
            {
                name: "semantic_search",
                description: "Searches the vector database for markdown documentation snippets matching the natural language query.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "The natural language search query (e.g., 'how does auth work?')." },
                        limit: { type: "number", description: "Max results to return (default 5)." },
                        threshold: { type: "number", description: "Distance threshold. Lower is stricter. (default 1.0)." }
                    },
                    required: ["query"]
                }
            }
        ];
    }

    public async handleCall(name: string, args: any): Promise<any | null> {
        try {
            if (name === "index_file") {
                const { filePath } = args;
                
                if (!fs.existsSync(filePath)) {
                    return { isError: true, content: [{ type: "text", text: `Error: File not found at ${filePath}` }] };
                }

                const content = fs.readFileSync(filePath, 'utf-8');
                
                // Idempotency: clear old vectors before re-indexing
                this.database.deleteVectorsForFile(filePath);

                // Simple line-based chunking (~1000 characters per chunk)
                const chunks = this.chunkText(content, 1000);
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    if (chunk.trim() === '') continue;
                    
                    const embedding = await this.embeddingService.generateEmbedding(chunk);
                    this.database.saveVector(filePath, 'MARKDOWN', i, chunk, embedding);
                }

                return { content: [{ type: "text", text: `Successfully indexed ${chunks.length} chunks from ${filePath}` }] };
            }

            if (name === "index_directory") {
                const { directoryPath } = args;
                if (!fs.existsSync(directoryPath)) return { isError: true, content: [{ type: "text", text: `Error: Directory not found at ${directoryPath}` }] };
                
                const files = this.getAllFiles(directoryPath);
                let totalChunks = 0;
                
                for (const file of files) {
                    this.database.deleteVectorsForFile(file); // Idempotency
                    
                    const content = fs.readFileSync(file, 'utf-8');
                    const chunks = this.chunkText(content, 1000);
                    
                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        if (chunk.trim() === '') continue;
                        const embedding = await this.embeddingService.generateEmbedding(chunk);
                        this.database.saveVector(file, 'MARKDOWN', i, chunk, embedding);
                        totalChunks++;
                    }
                }
                
                return { content: [{ type: "text", text: `Successfully indexed ${files.length} markdown files into ${totalChunks} total vector chunks.` }] };
            }

            if (name === "semantic_search") {
                const { query, limit = 5, threshold = 1.0 } = args;
                
                const embedding = await this.embeddingService.generateEmbedding(query);
                // Hardcode search to MARKDOWN only since we dropped code vectorization
                const results = this.database.searchVectors(embedding, limit, threshold, ['MARKDOWN']);

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

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);
        
        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
                    arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
                }
            } else {
                if (file.endsWith('.md') || file.endsWith('.mdx')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        });
        
        return arrayOfFiles;
    }
}
