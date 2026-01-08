export interface WorktreeStatusResult {
    success: boolean;
    worktree_path?: string;
    branch?: string;
    is_main?: boolean;
    exists?: boolean;
    status?: {
        uncommitted_changes: number;
        untracked_files: number;
        ahead: number;
        behind: number;
    };
    error?: string;
    summary?: string[];
}
/**
 * Get detailed status of a specific worktree
 */
export declare class WorktreeStatusTool {
    /**
     * Get status for a specific worktree path
     */
    static execute(params: {
        worktree_path: string;
    }): Promise<WorktreeStatusResult>;
}
//# sourceMappingURL=worktree-status.d.ts.map