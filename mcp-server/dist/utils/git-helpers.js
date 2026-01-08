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
exports.GitHelpers = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Git helper functions for worktree management
 */
class GitHelpers {
    /**
     * Check if a directory is a git repository
     */
    static async isGitRepo(dirPath) {
        try {
            const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', {
                cwd: dirPath,
            });
            return stdout.trim() === 'true';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get the current branch name
     */
    static async getCurrentBranch(dirPath) {
        try {
            const { stdout } = await execAsync('git branch --show-current', {
                cwd: dirPath,
            });
            return stdout.trim() || null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if a branch exists
     */
    static async branchExists(branchName, dirPath) {
        try {
            const { stdout } = await execAsync(`git show-ref --verify refs/heads/${branchName}`, {
                cwd: dirPath,
            });
            return stdout.trim().length > 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Create a new git worktree
     */
    static async createWorktree(params) {
        try {
            const workingDir = params.cwd || process.cwd();
            // Check if worktree path already exists
            if (fs.existsSync(params.path)) {
                return {
                    success: false,
                    error: `Worktree path already exists: ${params.path}`,
                };
            }
            // Check if branch already exists
            const branchExists = await this.branchExists(params.branch, workingDir);
            if (branchExists) {
                return {
                    success: false,
                    error: `Branch already exists: ${params.branch}. Use a different feature name or delete the existing branch.`,
                };
            }
            // Create worktree with new branch
            const command = `git worktree add -b ${params.branch} "${params.path}" ${params.baseBranch}`;
            await execAsync(command, { cwd: workingDir });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Unknown error creating worktree',
            };
        }
    }
    /**
     * List all git worktrees
     */
    static async listWorktrees(cwd) {
        try {
            const workingDir = cwd || process.cwd();
            const { stdout } = await execAsync('git worktree list --porcelain', {
                cwd: workingDir,
            });
            const worktrees = [];
            const lines = stdout.split('\n');
            let current = {};
            for (const line of lines) {
                if (line.startsWith('worktree ')) {
                    current.path = line.substring('worktree '.length);
                }
                else if (line.startsWith('branch ')) {
                    current.branch = line.substring('branch refs/heads/'.length);
                }
                else if (line.startsWith('HEAD ')) {
                    current.commit = line.substring('HEAD '.length);
                }
                else if (line.startsWith('bare')) {
                    current.is_main = false;
                }
                else if (line === '') {
                    // End of worktree entry
                    if (current.path) {
                        worktrees.push({
                            path: current.path,
                            branch: current.branch || 'unknown',
                            is_main: current.is_main !== false,
                            commit: current.commit,
                        });
                    }
                    current = {};
                }
            }
            return worktrees;
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Remove a git worktree
     */
    static async removeWorktree(worktreePath, cwd) {
        try {
            const workingDir = cwd || process.cwd();
            await execAsync(`git worktree remove "${worktreePath}"`, { cwd: workingDir });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Unknown error removing worktree',
            };
        }
    }
    /**
     * Get git status for a worktree
     */
    static async getStatus(dirPath) {
        try {
            // Get short status
            const { stdout: statusOut } = await execAsync('git status --short', { cwd: dirPath });
            const statusLines = statusOut.split('\n').filter((l) => l.trim().length > 0);
            const uncommitted = statusLines.filter((l) => l.startsWith(' M') || l.startsWith('M ')).length;
            const untracked = statusLines.filter((l) => l.startsWith('??')).length;
            // Get ahead/behind
            const { stdout: aheadBehindOut } = await execAsync('git rev-list --left-right --count @{upstream}...HEAD', { cwd: dirPath });
            const [behind, ahead] = aheadBehindOut.trim().split('\t').map(Number);
            return {
                uncommitted_changes: uncommitted,
                untracked_files: untracked,
                ahead: ahead || 0,
                behind: behind || 0,
            };
        }
        catch (error) {
            return {
                uncommitted_changes: 0,
                untracked_files: 0,
                ahead: 0,
                behind: 0,
            };
        }
    }
    /**
     * Check if a repository has git submodules
     */
    static hasSubmodules(dirPath) {
        try {
            const gitmodulesPath = path.join(dirPath, '.gitmodules');
            return fs.existsSync(gitmodulesPath);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Initialize git submodules recursively
     */
    static async initSubmodules(dirPath) {
        try {
            await execAsync('git submodule update --init --recursive', {
                cwd: dirPath,
                timeout: 10 * 60 * 1000, // 10 minutes
            });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Unknown error initializing submodules',
            };
        }
    }
}
exports.GitHelpers = GitHelpers;
//# sourceMappingURL=git-helpers.js.map