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
                description: `Creates or updates an entity in the graph. Allowed types: [${config.entityTypes.join(', ')}]`,
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        entityType: { type: "string" },
                        content: { type: "string" }
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
            }
        ];
    }

    public async handleCall(name: string, args: any): Promise<any | null> {
        try {
            if (name === "add_entity") {
                const { name: entityName, entityType, content } = args;
                this.graphService.addEntity({ name: entityName, entityType }, content || "");
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
            
            if (name === "expand_ontology") {
                const { category, newType } = args;
                if (category === "entity") {
                    this.graphService.newEntityType(newType);
                } else {
                    this.graphService.newEdgeType(newType);
                }
                return { content: [{ type: "text", text: `Successfully added ${newType} to ${category} ontology.` }] };
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
