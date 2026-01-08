"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorktreeStatusTool = void 0;
const git_helpers_1 = require("../utils/git-helpers");
const fs = __importStar(require("fs"));
/**
 * Get detailed status of a specific worktree
 */
class WorktreeStatusTool {
    /**
     * Get status for a specific worktree path
     */
    static async execute(params) {
        try {
            const { worktree_path } = params;
            // Check if worktree exists
            if (!fs.existsSync(worktree_path)) {
                return {
                    success: false,
                    worktree_path,
                    exists: false,
                    error: `Worktree does not exist: ${worktree_path}`,
                };
            }
            // Verify it's a git worktree
            const isGit = await git_helpers_1.GitHelpers.isGitRepo(worktree_path);
            if (!isGit) {
                return {
                    success: false,
                    worktree_path,
                    exists: true,
                    error: `Path exists but is not a git repository: ${worktree_path}`,
                };
            }
            // Get current branch
            const branch = await git_helpers_1.GitHelpers.getCurrentBranch(worktree_path);
            // Determine if this is the main worktree
            const allWorktrees = await git_helpers_1.GitHelpers.listWorktrees(worktree_path);
            const mainWorktree = allWorktrees.find((w) => w.is_main);
            const isMain = mainWorktree?.path === worktree_path;
            // Get status
            const status = await git_helpers_1.GitHelpers.getStatus(worktree_path);
            // Build summary
            const summary = [
                `Worktree: ${worktree_path}`,
                `Branch: ${branch || 'unknown'}`,
                '',
                'Status:',
                `  Uncommitted changes: ${status.uncommitted_changes}`,
                `  Untracked files: ${status.untracked_files}`,
                `  Commits ahead of remote: ${status.ahead}`,
                `  Commits behind remote: ${status.behind}`,
            ];
            // Add warnings if needed
            if (status.uncommitted_changes > 0 || status.untracked_files > 0) {
                summary.push('');
                summary.push('⚠️  Worktree has uncommitted changes');
            }
            if (status.behind > 0) {
                summary.push('⚠️  Worktree is behind remote');
            }
            if (status.uncommitted_changes === 0 && status.untracked_files === 0) {
                summary.push('');
                summary.push('✅ Worktree is clean');
            }
            return {
                success: true,
                worktree_path,
                branch: branch || undefined,
                is_main: isMain,
                exists: true,
                status,
                summary,
            };
        }
        catch (error) {
            return {
                success: false,
                worktree_path: params.worktree_path,
                error: error.message || 'Failed to get worktree status',
            };
        }
    }
}
exports.WorktreeStatusTool = WorktreeStatusTool;
//# sourceMappingURL=worktree-status.js.map