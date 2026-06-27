import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { GraphService } from './GraphService.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { ConfigLoader } from '../core/ConfigLoader.js';

// Mock the dependencies so we don't accidentally write to the real database/JSON during tests
vi.mock('../database/DatabaseService.js');
vi.mock('../core/ConfigLoader.js');

describe('GraphService', () => {
  let graphService: GraphService;
  let mockDb: Mocked<DatabaseService>;
  let mockConfig: Mocked<ConfigLoader>;

  beforeEach(() => {
    // Clear mock history before every test to ensure a clean slate
    vi.clearAllMocks();

    // Instantiate our mocked dependencies
    mockDb = new DatabaseService() as Mocked<DatabaseService>;
    mockConfig = new ConfigLoader() as Mocked<ConfigLoader>;

    // Inject them into the refactored GraphService
    graphService = new GraphService(mockDb, mockConfig);
  });

  it('should act as a Facade and delegate newEntityType to ConfigLoader', () => {
    graphService.newEntityType('TestComponent');
    
    // Validate that GraphService correctly handed the work off to the ConfigLoader
    expect(mockConfig.addEntityType).toHaveBeenCalledWith('TestComponent');
    expect(mockConfig.addEntityType).toHaveBeenCalledTimes(1);
  });

  it('should act as a Facade and delegate newEdgeType to ConfigLoader', () => {
    graphService.newEdgeType('TEST_EDGE');
    
    // Validate that GraphService correctly handed the work off to the ConfigLoader
    expect(mockConfig.addEdgeType).toHaveBeenCalledWith('TEST_EDGE');
    expect(mockConfig.addEdgeType).toHaveBeenCalledTimes(1);
  });
});
