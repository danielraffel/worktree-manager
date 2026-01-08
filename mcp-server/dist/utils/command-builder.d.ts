/**
 * Build commands for worktree operations
 */
export declare class CommandBuilder {
    /**
     * Escape a string for safe use in shell commands
     * Uses $'...' syntax which handles all special characters properly
     */
    static escapeForShell(str: string): string;
    /**
     * Build bash command to execute in worktree directory
     */
    static buildWorktreeCommand(params: {
        worktree_path: string;
        command: string;
        background?: boolean;
    }): string;
}
//# sourceMappingURL=command-builder.d.ts.map