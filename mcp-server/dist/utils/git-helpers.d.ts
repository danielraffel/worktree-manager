import { WorktreeInfo } from '../types';
/**
 * Git helper functions for worktree management
 */
export declare class GitHelpers {
    /**
     * Check if a directory is a git repository
     */
    static isGitRepo(dirPath: string): Promise<boolean>;
    /**
     * Get the current branch name
     */
    static getCurrentBranch(dirPath: string): Promise<string | null>;
    /**
     * Check if a branch exists
     */
    static branchExists(branchName: string, dirPath: string): Promise<boolean>;
    /**
     * Create a new git worktree
     */
    static createWorktree(params: {
        path: string;
        branch: string;
        baseBranch: string;
        cwd?: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * List all git worktrees
     */
    static listWorktrees(cwd?: string): Promise<WorktreeInfo[]>;
    /**
     * Remove a git worktree
     */
    static removeWorktree(worktreePath: string, cwd?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get git status for a worktree
     */
    static getStatus(dirPath: string): Promise<{
        uncommitted_changes: number;
        untracked_files: number;
        ahead: number;
        behind: number;
    }>;
    /**
     * Check if a repository has git submodules
     */
    static hasSubmodules(dirPath: string): boolean;
    /**
     * Initialize git submodules recursively
     */
    static initSubmodules(dirPath: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=git-helpers.d.ts.map