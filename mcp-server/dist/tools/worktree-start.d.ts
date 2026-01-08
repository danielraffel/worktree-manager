import { WorktreeStartParams, WorktreeStartResult } from '../types';
/**
 * Main tool for creating git worktrees with auto-setup
 * Refactored to be worktree-only - workflows delegated to Chainer plugin
 */
export declare class WorktreeStartTool {
    /**
     * Create a new worktree with auto-setup
     */
    static execute(params: WorktreeStartParams): Promise<WorktreeStartResult>;
    /**
     * Build success result with Chainer detection and suggestions
     */
    private static buildSuccessResult;
}
//# sourceMappingURL=worktree-start.d.ts.map