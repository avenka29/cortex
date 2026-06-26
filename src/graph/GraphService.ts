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

    // Add new entity type to allowed list
    public newEntityType(newNodeType: string) {
        this.configLoader.addEntityType(newNodeType);
    }

    // Add new edge type to allowed list
    public newEdgeType(newNodeType: string) {
        this.configLoader.addEdgeType(newNodeType);
    }
}
