import fs from 'fs';
import path from 'path';

export interface CortexConfig {
  entityTypes: string[];
  edgeTypes: string[];
}

const DEFAULT_CONFIG: CortexConfig = {
  entityTypes: ["Component", "DatabaseTable", "Service", "Route", "BusinessRule"],
  edgeTypes: ["DEPENDS_ON", "CALLS_API", "WRITES_TO", "READS_FROM", "IMPLEMENTS"]
};

export class ConfigLoader {
  private config: CortexConfig = DEFAULT_CONFIG;
  private configPath: string = path.resolve(process.cwd(), '.cortex', 'config.json');

  public loadConfig() {
    if (fs.existsSync(this.configPath)) {
      try {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Strict Validation: Fail fast if the structure is broken
        if (!Array.isArray(parsed.entityTypes) || parsed.entityTypes.length === 0) {
          throw new Error("Invalid config: 'entityTypes' must be a non-empty array.");
        }
        if (!Array.isArray(parsed.edgeTypes) || parsed.edgeTypes.length === 0) {
          throw new Error("Invalid config: 'edgeTypes' must be a non-empty array.");
        }
        
        this.config = {
          entityTypes: parsed.entityTypes,
          edgeTypes: parsed.edgeTypes,
        };
        console.error(`[Config] Loaded custom ontology from ${this.configPath}`);
      } catch (err) {
        console.error(`[Config] FATAL ERROR: Invalid configuration at ${this.configPath}`);
        throw err; // Fail-fast on startup
      }
    } else {
      console.error(`[Config] No config found. Creating default ontology at ${this.configPath}`);
      // Auto-create the file so it's always ready to be updated
      this.saveToDisk();
    }
  }

  public getConfig(): CortexConfig {
    return this.config;
  }

  /**
   * Adds a new entity type to the ontology and permanently saves it to the config file.
   */
  public addEntityType(type: string) {
    if (!this.config.entityTypes.includes(type)) {
      this.config.entityTypes.push(type);
      this.saveToDisk();
    }
  }

  /**
   * Adds a new edge type to the ontology and permanently saves it to the config file.
   */
  public addEdgeType(type: string) {
    if (!this.config.edgeTypes.includes(type)) {
      this.config.edgeTypes.push(type);
      this.saveToDisk();
    }
  }

  /**
   * Writes the current ontology to the config file. 
   * Can be wired into process.on('exit') as a finally-block equivalent.
   */
  public saveToDisk() {
    // Ensure the .cortex directory exists
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write back with beautiful 2-space formatting
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    console.error(`[Config] Wrote updated ontology to ${this.configPath}`);
  }
}
