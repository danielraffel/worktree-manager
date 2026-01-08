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
exports.WorktreeCleanupTool = void 0;
const git_helpers_1 = require("../utils/git-helpers");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Clean up worktree: merge and remove
 */
class WorktreeCleanupTool {
    /**
     * Merge and/or remove a worktree
     */
    static async execute(params) {
        const { worktree_path, auto_merge = false, target_branch = 'main', force = false, delete_branch = true, } = params;
        const messages = [];
        try {
            // Check if worktree exists
            if (!fs.existsSync(worktree_path)) {
                return {
                    success: false,
                    worktree_path,
                    messages: [`Worktree does not exist: ${worktree_path}`],
                    error: 'Worktree not found',
                };
            }
            // Get current branch
            const branch = await git_helpers_1.GitHelpers.getCurrentBranch(worktree_path);
            if (!branch) {
                return {
                    success: false,
                    worktree_path,
                    messages: ['Could not determine current branch'],
                    error: 'Failed to get branch name',
                };
            }
            messages.push(`Worktree: ${worktree_path}`);
            messages.push(`Branch: ${branch}`);
            // Check for uncommitted changes
            const status = await git_helpers_1.GitHelpers.getStatus(worktree_path);
            const hasChanges = status.uncommitted_changes > 0 || status.untracked_files > 0;
            if (hasChanges && !force) {
                return {
                    success: false,
                    worktree_path,
                    branch,
                    messages: [
                        ...messages,
                        '',
                        '❌ Worktree has uncommitted changes:',
                        `   - Uncommitted: ${status.uncommitted_changes}`,
                        `   - Untracked: ${status.untracked_files}`,
                        '',
                        'Options:',
                        '1. Commit or stash changes first',
                        '2. Use force: true to remove anyway (LOSES CHANGES)',
                    ],
                    error: 'Uncommitted changes prevent cleanup',
                    next_steps: [
                        `cd ${worktree_path}`,
                        'git status',
                        'git add . && git commit -m "message" (or git stash)',
                    ],
                };
            }
            let merged = false;
            let removed = false;
            let branchDeleted = false;
            // Auto-merge if requested
            if (auto_merge) {
                messages.push('');
                messages.push(`Merging ${branch} into ${target_branch}...`);
                try {
                    // Switch to target branch in main worktree
                    const cwd = process.cwd();
                    await execAsync(`git checkout ${target_branch}`, { cwd });
                    // Merge feature branch
                    await execAsync(`git merge ${branch} --no-edit`, { cwd });
                    messages.push(`✅ Merged ${branch} into ${target_branch}`);
                    merged = true;
                }
                catch (error) {
                    return {
                        success: false,
                        worktree_path,
                        branch,
                        merged: false,
                        messages: [
                            ...messages,
                            `❌ Merge failed: ${error.message}`,
                            '',
                            'Possible issues:',
                            '- Merge conflicts',
                            '- Not all changes pushed to remote',
                            '- Target branch does not exist',
                        ],
                        error: `Merge failed: ${error.message}`,
                        next_steps: [
                            'Resolve conflicts manually:',
                            `  git checkout ${target_branch}`,
                            `  git merge ${branch}`,
                            '  (resolve conflicts)',
                            '  git commit',
                        ],
                    };
                }
            }
            // Remove worktree
            messages.push('');
            messages.push('Removing worktree...');
            const removeResult = await git_helpers_1.GitHelpers.removeWorktree(worktree_path);
            if (!removeResult.success) {
                return {
                    success: false,
                    worktree_path,
                    branch,
                    merged,
                    messages: [...messages, `❌ Failed to remove worktree: ${removeResult.error}`],
                    error: removeResult.error,
                };
            }
            messages.push(`✅ Worktree removed: ${worktree_path}`);
            removed = true;
            // Delete branch if requested and merged
            if (delete_branch && merged) {
                messages.push('');
                messages.push(`Deleting branch ${branch}...`);
                try {
                    const cwd = process.cwd();
                    await execAsync(`git branch -d ${branch}`, { cwd });
                    messages.push(`✅ Branch deleted: ${branch}`);
                    branchDeleted = true;
                }
                catch (error) {
                    messages.push(`⚠️  Failed to delete branch: ${error.message}`);
                    messages.push('(Branch may still have unmerged commits)');
                }
            }
            const nextSteps = [];
            if (merged) {
                nextSteps.push(`Changes from ${branch} are now in ${target_branch}`);
                nextSteps.push(`Push to remote: git push origin ${target_branch}`);
            }
            else {
                nextSteps.push('Worktree removed but changes NOT merged');
                nextSteps.push(`Feature branch ${branch} still exists`);
                nextSteps.push('Merge manually if needed:');
                nextSteps.push(`  git checkout ${target_branch}`);
                nextSteps.push(`  git merge ${branch}`);
            }
            return {
                success: true,
                worktree_path,
                branch,
                merged,
                removed,
                branch_deleted: branchDeleted,
                messages,
                next_steps: nextSteps,
            };
        }
        catch (error) {
            return {
                success: false,
                worktree_path,
                messages: [...messages, `❌ Cleanup failed: ${error.message}`],
                error: error.message || 'Unknown error during cleanup',
            };
        }
    }
}
exports.WorktreeCleanupTool = WorktreeCleanupTool;
//# sourceMappingURL=worktree-cleanup.js.map