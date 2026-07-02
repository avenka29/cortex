import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runCLI } from './cli.js';

// Mock dependencies before importing the module
vi.mock('fs');
vi.mock('./database/DatabaseService.js', () => ({
    DatabaseService: class {}
}));
vi.mock('./core/ConfigLoader.js', () => ({
    ConfigLoader: class {
        loadConfig = vi.fn();
    }
}));
vi.mock('./graph/GraphService.js', () => ({
    GraphService: class {
        loadGraph = vi.fn();
    }
}));
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
    Server: vi.fn()
}));
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
    StdioServerTransport: vi.fn()
}));

describe('CLI Init Logic', () => {
    let mockExit: any;
    let mockConsoleLog: any;
    let mockConsoleError: any;
    
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        
        mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
        mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
    });

    afterEach(() => {
        mockExit.mockRestore();
        mockConsoleLog.mockRestore();
        mockConsoleError.mockRestore();
        vi.restoreAllMocks();
    });

    const runCliWithArgs = async (args: string[]) => {
        process.argv = ['node', 'cli.js', ...args];
        await runCLI();
    };

    it('should default to cortex-instructions.md if no provider files exist and no args given', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        
        await runCliWithArgs(['init']);
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.resolve('/mock/cwd', 'cortex-instructions.md'),
            expect.stringContaining('Cortex MCP Instructions')
        );
    });

    it('should append to an existing known provider file if no args given', async () => {
        // Pretend .cursorrules exists
        vi.mocked(fs.existsSync).mockImplementation((p: any) => {
            if (p.includes('.cursorrules')) return true;
            return false;
        });
        vi.mocked(fs.readFileSync).mockReturnValue('existing content');

        await runCliWithArgs(['init']);
        
        expect(fs.appendFileSync).toHaveBeenCalledWith(
            path.resolve('/mock/cwd', '.cursorrules'),
            expect.stringContaining('Cortex MCP Instructions')
        );
    });

    it('should not append if instructions already exist in the file', async () => {
        vi.mocked(fs.existsSync).mockImplementation((p: any) => p.includes('.cursorrules'));
        vi.mocked(fs.readFileSync).mockReturnValue('existing content\nCortex MCP Instructions');

        await runCliWithArgs(['init']);
        
        expect(fs.appendFileSync).not.toHaveBeenCalled();
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Instructions already present'));
    });

    it('should apply to a specific provider if provided as arg', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        await runCliWithArgs(['init', 'antigravity']);
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.resolve('/mock/cwd', '.agents/AGENTS.md'),
            expect.stringContaining('Cortex MCP Instructions')
        );
    });

    it('should apply to a custom file if a custom arg is provided', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        await runCliWithArgs(['init', 'my-custom-ai.md']);
        
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.resolve('/mock/cwd', 'my-custom-ai.md'),
            expect.stringContaining('Cortex MCP Instructions')
        );
    });

    it('should show an error if an unknown provider is given without a file extension', async () => {
        await runCliWithArgs(['init', 'unknown-bot']);

        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Unknown AI provider: 'unknown-bot'"));
        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Supported providers:"));
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
