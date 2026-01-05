/**
 * Core types for worktree-manager plugin
 */

export type WorkflowMode = 'simple';
export type ExecutionMode = 'manual' | 'background' | 'interactive';
export type ProjectType = 'web' | 'ios' | 'full-stack' | 'unknown';

export interface WorktreeStartParams {
  /** Name of feature (becomes branch: feature/<name>) */
  feature_name: string;
  /** Branch to branch from (default: "main") */
  base_branch?: string;
  /** Description of what you're working on */
  task_description?: string;
  /** Custom worktree location (default: ~/worktrees/<feature_name>) */
  worktree_path?: string;
  /** Workflow mode (always 'simple' now - use Chainer for workflows) */
  workflow?: WorkflowMode;
}

export interface WorktreeInfo {
  /** Absolute path to worktree */
  path: string;
  /** Branch name */
  branch: string;
  /** Is this the main worktree? */
  is_main: boolean;
  /** Commit SHA */
  commit?: string;
}

export interface WorktreeStartResult {
  /** Success status */
  success: boolean;
  /** Worktree path */
  worktree_path: string;
  /** Branch name */
  branch: string;
  /** Workflow mode used */
  workflow: WorkflowMode;
  /** Setup status */
  setup_complete: boolean;
  /** Setup messages */
  setup_messages: string[];
  /** Error message (if success = false) */
  error?: string;
  /** Next steps for user */
  next_steps: string[];
}

export interface ProjectDetectionResult {
  /** Type of project detected */
  type: ProjectType;
  /** Setup commands to run */
  setup_commands: SetupCommand[];
  /** Detection details */
  details: {
    has_web: boolean;
    has_ios: boolean;
    has_root_package_json: boolean;
  };
}

export interface SetupCommand {
  /** Directory to run command in */
  directory: string;
  /** Command to execute */
  command: string;
  /** Description of what this does */
  description: string;
}

export interface GitHelpers {
  /** Create a new worktree */
  createWorktree(params: {
    path: string;
    branch: string;
    baseBranch: string;
  }): Promise<{ success: boolean; error?: string }>;

  /** List all worktrees */
  listWorktrees(): Promise<WorktreeInfo[]>;

  /** Remove a worktree */
  removeWorktree(path: string): Promise<{ success: boolean; error?: string }>;

  /** Check if path is a git repository */
  isGitRepo(path: string): Promise<boolean>;

  /** Get current branch name */
  getCurrentBranch(path: string): Promise<string | null>;
}
