export interface ToolProvider {
    /** 
     * Returns the list of tools this provider is responsible for exposing to the AI.
     */
    getDefinitions(): any[];
    
    /** 
     * Handles the tool execution. 
     * If the tool name belongs to this provider, it executes and returns the result.
     * If the tool name is unknown to this provider, it returns null so the router can check the next provider.
     */
    handleCall(name: string, args: any): Promise<any | null>;
}
