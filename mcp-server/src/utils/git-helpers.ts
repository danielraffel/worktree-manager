import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { WorktreeInfo } from '../types';

const execAsync = promisify(exec);

/**
 * Git helper functions for worktree management
 */
export class GitHelpers {
  /**
   * Check if a directory is a git repository
   */
  static async isGitRepo(dirPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', {
        cwd: dirPath,
      });
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current branch name
   */
  static async getCurrentBranch(dirPath: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: dirPath,
      });
      return stdout.trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a branch exists
   */
  static async branchExists(branchName: string, dirPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`git show-ref --verify refs/heads/${branchName}`, {
        cwd: dirPath,
      });
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a new git worktree
   */
  static async createWorktree(params: {
    path: string;
    branch: string;
    baseBranch: string;
    cwd?: string;
  }): Promise<{ success: boolean; error?: string }> {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error creating worktree',
      };
    }
  }

  /**
   * List all git worktrees
   */
  static async listWorktrees(cwd?: string): Promise<WorktreeInfo[]> {
    try {
      const workingDir = cwd || process.cwd();
      const { stdout } = await execAsync('git worktree list --porcelain', {
        cwd: workingDir,
      });

      const worktrees: WorktreeInfo[] = [];
      const lines = stdout.split('\n');
      let current: Partial<WorktreeInfo> = {};

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          current.path = line.substring('worktree '.length);
        } else if (line.startsWith('branch ')) {
          current.branch = line.substring('branch refs/heads/'.length);
        } else if (line.startsWith('HEAD ')) {
          current.commit = line.substring('HEAD '.length);
        } else if (line.startsWith('bare')) {
          current.is_main = false;
        } else if (line === '') {
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
    } catch (error) {
      return [];
    }
  }

  /**
   * Remove a git worktree
   */
  static async removeWorktree(
    worktreePath: string,
    cwd?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const workingDir = cwd || process.cwd();
      await execAsync(`git worktree remove "${worktreePath}"`, { cwd: workingDir });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error removing worktree',
      };
    }
  }

  /**
   * Get git status for a worktree
   */
  static async getStatus(dirPath: string): Promise<{
    uncommitted_changes: number;
    untracked_files: number;
    ahead: number;
    behind: number;
  }> {
    try {
      // Get short status
      const { stdout: statusOut } = await execAsync('git status --short', { cwd: dirPath });
      const statusLines = statusOut.split('\n').filter((l) => l.trim().length > 0);

      const uncommitted = statusLines.filter((l) => l.startsWith(' M') || l.startsWith('M ')).length;
      const untracked = statusLines.filter((l) => l.startsWith('??')).length;

      // Get ahead/behind
      const { stdout: aheadBehindOut } = await execAsync(
        'git rev-list --left-right --count @{upstream}...HEAD',
        { cwd: dirPath }
      );
      const [behind, ahead] = aheadBehindOut.trim().split('\t').map(Number);

      return {
        uncommitted_changes: uncommitted,
        untracked_files: untracked,
        ahead: ahead || 0,
        behind: behind || 0,
      };
    } catch (error) {
      return {
        uncommitted_changes: 0,
        untracked_files: 0,
        ahead: 0,
        behind: 0,
      };
    }
  }
}
