import { DatabaseService } from "../database/DatabaseService.js";
import { ConfigLoader } from "../core/ConfigLoader.js";

//Represents information (not related to graph)
export interface Entity {
    name: string; // Set by ai (needs to be unique)
    entityType: string; // malleable list set with config but can change
}

//Maps two entities with a specific relationship
export interface Edge {
  source: string;  
  target: string;
  edgeType: string; // malleable list that can change but set upon config
}

//Represents a graph node
export interface Node {
    nodeData: Entity;
    outgoing: Edge[];
    incoming: Edge[];
}

/**
 * Graph service handles managemnet of node knowledge bases
 * Nodes and edges are defined at load time, but new types can be added at runtime
 */
export class GraphService {


    //In memory graph built form sqlite
    private graph: Map<string, Node>;

    private database: DatabaseService;

    //To access project configuration
    private configLoader: ConfigLoader;

    constructor(database: DatabaseService, configLoader: ConfigLoader) {
        this.graph = new Map<string, Node>();
        this.configLoader = configLoader;
        this.database = database;
    }

    /**
     * Pulls the topology from SQLite and builds the O(1) in-memory Adjacency Map.
     * Enforces the ontology: gracefully ignores nodes that use deprecated/removed types.
     */
    public loadGraph() {
        this.graph.clear();
        
        // 1. Fetch raw data (Lazy-loaded, no Markdown content)
        const allEntities = this.database.getAllEntities();
        const allEdges = this.database.getAllEdges();
        const allowedTypes = this.configLoader.getConfig().entityTypes;

        // 2. Populate Nodes
        for (const entity of allEntities) {
            // Soft-Enforcement: If the config no longer allows this type, we don't load it into memory.
            if (allowedTypes.includes(entity.entityType)) {
                this.graph.set(entity.name, {
                    nodeData: entity,
                    incoming: [],
                    outgoing: []
                });
            } else {
                console.warn(`[GraphService] Ignoring entity '${entity.name}' because type '${entity.entityType}' is missing from config.json.`);
            }
        }

        // 3. Populate Edges (Adjacency Lists)
        for (const edge of allEdges) {
            const sourceNode = this.graph.get(edge.source);
            const targetNode = this.graph.get(edge.target);

            // Only map the edge if both source and target nodes were successfully loaded
            if (sourceNode && targetNode) {
                sourceNode.outgoing.push(edge);
                targetNode.incoming.push(edge);
            }
        }

        console.log(`[GraphService] Successfully built memory map with ${this.graph.size} active nodes.`);
    }

    /**
     * Adds an entity to the graph and persists it to the database.
     * Enforces the ontology before allowing the creation.
     */
    public addEntity(entity: Entity, content: string = "") {
        const allowedTypes = this.configLoader.getConfig().entityTypes;
        if (!allowedTypes.includes(entity.entityType)) {
            throw new Error(`[GraphService] Cannot add entity '${entity.name}'. Type '${entity.entityType}' is not in the allowed ontology.`);
        }

        // Add to Database (Storage)
        this.database.upsertEntity(entity, content);

        // Add to Memory (Preserve edges if updating an existing node)
        const existingNode = this.graph.get(entity.name);
        this.graph.set(entity.name, {
            nodeData: entity,
            incoming: existingNode ? existingNode.incoming : [],
            outgoing: existingNode ? existingNode.outgoing : []
        });
    }

    /**
     * Adds a directed edge between two entities and persists it.
     */
    public addEdge(edge: Edge) {
        const allowedTypes = this.configLoader.getConfig().edgeTypes;
        if (!allowedTypes.includes(edge.edgeType)) {
            throw new Error(`[GraphService] Cannot add edge. Type '${edge.edgeType}' is not in the allowed ontology.`);
        }

        const sourceNode = this.graph.get(edge.source);
        const targetNode = this.graph.get(edge.target);

        if (!sourceNode || !targetNode) {
            throw new Error(`[GraphService] Cannot add edge. Source or target entity does not exist in the active graph.`);
        }

        // Add to Database (Storage)
        this.database.addEdge(edge);

        // Add to Memory
        sourceNode.outgoing.push(edge);
        targetNode.incoming.push(edge);
    }

    /**
     * Instantly returns the full topological blast radius for any entity.
     */
    public getConnections(name: string): Node | undefined {
        return this.graph.get(name);
    }

    // Add new entity type to allowed list
    public newEntityType(newNodeType: string) {
        this.configLoader.addEntityType(newNodeType);
    }

    // Add new edge type to allowed list
    public newEdgeType(newNodeType: string) {
        this.configLoader.addEdgeType(newNodeType);
    }
}
