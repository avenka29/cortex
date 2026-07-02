import { ToolProvider } from './ToolProvider.js';
import { GraphService } from '../../graph/GraphService.js';
import { DatabaseService } from '../../database/DatabaseService.js';
import { ConfigLoader } from '../../core/ConfigLoader.js';

export class GraphToolProvider implements ToolProvider {
    constructor(
        private graphService: GraphService,
        private database: DatabaseService,
        private configLoader: ConfigLoader
    ) {}

    public getDefinitions(): any[] {
        const config = this.configLoader.getConfig();
        return [
            {
                name: "add_entity",
                description: `Creates or updates an entity in the graph. Allowed types: [${config.entityTypes.join(', ')}].\nCRITICAL: You are highly encouraged to physically read the raw source code files using your file reading tools before adding an entity here, especially for code-related artifacts. Hallucinating entities that do not exist is bad practice. Provide the associated filePaths when applicable.`,
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        entityType: { type: "string" },
                        content: { type: "string" },
                        filePaths: { 
                            type: "array", 
                            items: { type: "string" },
                            description: "Paths to the physical files this entity represents."
                        }
                    },
                    required: ["name", "entityType"]
                }
            },
            {
                name: "add_edge",
                description: `Draws a directed relationship between two entities. Allowed edge types: [${config.edgeTypes.join(', ')}]`,
                inputSchema: {
                    type: "object",
                    properties: {
                        source: { type: "string" },
                        target: { type: "string" },
                        edgeType: { type: "string" }
                    },
                    required: ["source", "target", "edgeType"]
                }
            },
            {
                name: "get_blast_radius",
                description: "Instantly returns the incoming/outgoing dependencies of an entity, plus its rich markdown content.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string" }
                    },
                    required: ["name"]
                }
            },
            {
                name: "search_entities",
                description: "Searches for existing entities in the graph by name. Use this to find the exact entity names needed for get_blast_radius.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Optional substring to search for. Leave empty to list all entities." }
                    }
                }
            },
            {
                name: "expand_ontology",
                description: "Adds a new allowed entityType or edgeType to the strict configuration.",
                inputSchema: {
                    type: "object",
                    properties: {
                        category: { type: "string", enum: ["entity", "edge"] },
                        newType: { type: "string" }
                    },
                    required: ["category", "newType"]
                }
            },
            {
                name: "run_custom_query",
                description: "Runs a custom SQL SELECT query against the knowledge graph database. Useful for complex filters or aggregations.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "The SQL SELECT query to run (e.g., 'SELECT * FROM nodes')" }
                    },
                    required: ["query"]
                }
            }
        ];
    }

    public async handleCall(name: string, args: any): Promise<any | null> {
        try {
            if (name === "add_entity") {
                const { name: entityName, entityType, content, filePaths } = args;
                
                let finalContent = content || "";
                if (filePaths && Array.isArray(filePaths) && filePaths.length > 0) {
                    finalContent += `\n\n### Associated Files\n` + filePaths.map((f: string) => `- ${f}`).join('\n');
                }
                
                this.graphService.addEntity({ name: entityName, entityType }, finalContent);
                return { content: [{ type: "text", text: `Successfully added entity: ${entityName}` }] };
            } 
            
            if (name === "add_edge") {
                const { source, target, edgeType } = args;
                this.graphService.addEdge({ source, target, edgeType });
                return { content: [{ type: "text", text: `Successfully linked ${source} -> ${target}` }] };
            }
            
            if (name === "get_blast_radius") {
                const { name: entityName } = args;
                const connections = this.graphService.getConnections(entityName);
                
                if (!connections) {
                    return { content: [{ type: "text", text: `Entity ${entityName} not found in graph.` }] };
                }
                
                const richContent = this.database.getEntityContent(entityName);
                
                return {
                    content: [{
                        type: "text", 
                        text: JSON.stringify({
                            topology: connections,
                            markdown_content: richContent
                        }, null, 2)
                    }]
                };
            }
            
            if (name === "search_entities") {
                const { query } = args;
                const entities = this.database.getAllEntities();
                const matches = query 
                    ? entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
                    : entities;
                
                return { content: [{ type: "text", text: JSON.stringify(matches, null, 2) }] };
            }

            if (name === "expand_ontology") {
                const { category, newType } = args;
                if (category === "entity") {
                    this.graphService.newEntityType(newType);
                } else {
                    this.graphService.newEdgeType(newType);
                }
                return { content: [{ type: "text", text: `Successfully added ${newType} to ${category} ontology.` }] };
            }

            if (name === "run_custom_query") {
                const { query } = args;
                if (!query.trim().toUpperCase().startsWith('SELECT')) {
                    throw new Error("Only SELECT queries are allowed for security reasons.");
                }
                const results = this.database.executeCustomQuery(query);
                return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
            }

            // If the tool name doesn't match any of ours, return null so the Router checks the next provider
            return null;

        } catch (error: any) {
            // Strict Ontology errors bubble up to the AI here
            return {
                content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }],
                isError: true
            };
        }
    }
}
