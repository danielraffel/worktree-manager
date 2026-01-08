"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorktreeListTool = void 0;
const git_helpers_1 = require("../utils/git-helpers");
/**
 * List all git worktrees with optional status information
 */
class WorktreeListTool {
    /**
     * List all worktrees, optionally with status
     */
    static async execute(params) {
        try {
            const includeStatus = params?.include_status || false;
            const cwd = process.cwd();
            // Get all worktrees
            const worktrees = await git_helpers_1.GitHelpers.listWorktrees(cwd);
            // Optionally fetch status for each worktree
            const enrichedWorktrees = await Promise.all(worktrees.map(async (worktree) => {
                if (includeStatus) {
                    try {
                        const status = await git_helpers_1.GitHelpers.getStatus(worktree.path);
                        return { ...worktree, status };
                    }
                    catch (error) {
                        // If status fails, return without it
                        return worktree;
                    }
                }
                return worktree;
            }));
            return {
                success: true,
                worktrees: enrichedWorktrees,
            };
        }
        catch (error) {
            return {
                success: false,
                worktrees: [],
                error: error.message || 'Failed to list worktrees',
            };
        }
    }
}
exports.WorktreeListTool = WorktreeListTool;
//# sourceMappingURL=worktree-list.js.map