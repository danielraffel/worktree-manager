export interface WorktreeCleanupParams {
    worktree_path: string;
    /** Auto-merge to base branch before removing (default: false) */
    auto_merge?: boolean;
    /** Target branch to merge into (default: 'main') */
    target_branch?: string;
    /** Force remove even if there are uncommitted changes (default: false) */
    force?: boolean;
    /** Delete the feature branch after merging (default: true) */
    delete_branch?: boolean;
}
export interface WorktreeCleanupResult {
    success: boolean;
    worktree_path: string;
    branch?: string;
    merged?: boolean;
    removed?: boolean;
    branch_deleted?: boolean;
    messages: string[];
    error?: string;
    next_steps?: string[];
}
/**
 * Clean up worktree: merge and remove
 */
export declare class WorktreeCleanupTool {
    /**
     * Merge and/or remove a worktree
     */
    static execute(params: WorktreeCleanupParams): Promise<WorktreeCleanupResult>;
}
//# sourceMappingURL=worktree-cleanup.d.ts.map