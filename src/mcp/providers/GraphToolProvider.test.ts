import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { GraphToolProvider } from './GraphToolProvider.js';
import { GraphService } from '../../graph/GraphService.js';
import { DatabaseService } from '../../database/DatabaseService.js';
import { ConfigLoader } from '../../core/ConfigLoader.js';

// Mock the dependencies
vi.mock('../../graph/GraphService.js');
vi.mock('../../database/DatabaseService.js');
vi.mock('../../core/ConfigLoader.js');

describe('GraphToolProvider', () => {
    let provider: GraphToolProvider;
    let mockGraph: Mocked<GraphService>;
    let mockDb: Mocked<DatabaseService>;
    let mockConfig: Mocked<ConfigLoader>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Instantiate the mocked dependencies
        mockGraph = new GraphService({} as any, {} as any) as Mocked<GraphService>;
        mockDb = new DatabaseService() as Mocked<DatabaseService>;
        mockConfig = new ConfigLoader() as Mocked<ConfigLoader>;

        // Provide dummy config for the getDefinitions() test
        mockConfig.getConfig.mockReturnValue({
            entityTypes: ['Component'],
            edgeTypes: ['DEPENDS_ON']
        });

        provider = new GraphToolProvider(mockGraph, mockDb, mockConfig);
    });

    it('should return definitions with injected config arrays', () => {
        const definitions = provider.getDefinitions();
        
        // Ensure the config gets properly injected into the tool description
        const addEntityTool = definitions.find(d => d.name === 'add_entity');
        expect(addEntityTool.description).toContain('[Component]');
    });

    it('should return null for unknown tool names', async () => {
        const result = await provider.handleCall('some_made_up_tool', {});
        
        // This is a critical contract requirement! 
        // If it returns null, index.ts knows to pass it to the next provider.
        expect(result).toBeNull();
    });

    it('should successfully route add_entity arguments to the GraphService', async () => {
        const result = await provider.handleCall('add_entity', {
            name: 'AuthService',
            entityType: 'Component',
            content: '# Auth Markdown'
        });

        // Ensure GraphService received the strongly-typed arguments
        expect(mockGraph.addEntity).toHaveBeenCalledWith(
            { name: 'AuthService', entityType: 'Component' },
            '# Auth Markdown'
        );

        // Ensure the response is perfectly formatted for the MCP Protocol
        expect(result?.content[0].type).toBe('text');
        expect(result?.content[0].text).toContain('Successfully added');
    });

    it('should catch Strict Ontology Errors and format them for the AI', async () => {
        // Force the mock GraphService to throw an Error (simulating a bad entityType)
        mockGraph.addEntity.mockImplementation(() => {
            throw new Error('Type FakeType is not in the allowed ontology.');
        });

        const result = await provider.handleCall('add_entity', {
            name: 'AuthService',
            entityType: 'FakeType'
        });

        // Ensure the MCP Server doesn't crash, but instead gracefully returns an isError flag!
        expect(result?.isError).toBe(true);
        expect(result?.content[0].text).toContain('FakeType is not in the allowed ontology.');
    });

    it('should successfully execute run_custom_query', async () => {
        mockDb.executeCustomQuery.mockReturnValue([{ name: 'TestNode' }]);
        
        const result = await provider.handleCall('run_custom_query', {
            query: 'SELECT * FROM nodes'
        });

        expect(mockDb.executeCustomQuery).toHaveBeenCalledWith('SELECT * FROM nodes');
        expect(result?.content[0].text).toContain('TestNode');
    });

    it('should reject non-SELECT queries in run_custom_query', async () => {
        const result = await provider.handleCall('run_custom_query', {
            query: 'DELETE FROM nodes'
        });

        expect(result?.isError).toBe(true);
        expect(result?.content[0].text).toContain('Only SELECT queries are allowed for security reasons.');
    });
});
