export interface WorktreeListResult {
    success: boolean;
    worktrees: Array<{
        path: string;
        branch: string;
        is_main: boolean;
        commit?: string;
        status?: {
            uncommitted_changes: number;
            untracked_files: number;
            ahead: number;
            behind: number;
        };
    }>;
    error?: string;
}
/**
 * List all git worktrees with optional status information
 */
export declare class WorktreeListTool {
    /**
     * List all worktrees, optionally with status
     */
    static execute(params?: {
        include_status?: boolean;
    }): Promise<WorktreeListResult>;
}
//# sourceMappingURL=worktree-list.d.ts.map