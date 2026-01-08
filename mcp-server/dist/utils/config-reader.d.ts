/**
 * Configuration options for worktree-manager
 */
export interface WorktreeConfig {
    /** Base directory for worktrees (default: ~/worktrees) */
    worktree_base_path: string;
    /** Prefix for feature branches (default: feature/) */
    branch_prefix: string;
    /** Auto-commit changes periodically (default: false) */
    auto_commit: boolean;
    /** Auto-push to remote after commits (default: false) */
    auto_push: boolean;
    /** Create learnings.md file to capture insights (default: false) */
    create_learnings_file: boolean;
    /** Auto-initialize git submodules (default: true) */
    auto_init_submodules: boolean;
    /** Directory for spec files (default: audit) */
    spec_directory: string;
    /** Max iterations for ralph (default: 50) */
    default_max_iterations: number;
}
/**
 * Read and parse worktree-manager configuration
 *
 * Looks for config in these locations (in order):
 * 1. Project-level: .claude/worktree-manager.local.md
 * 2. User-level: ~/.claude/worktree-manager.local.md
 *
 * Config file format:
 * ```
 * ---
 * worktree_base_path: ~/my-worktrees
 * auto_commit: true
 * ---
 *
 * # Additional notes or context
 * ```
 */
export declare class ConfigReader {
    /**
     * Get merged configuration (defaults + user overrides)
     */
    static getConfig(projectPath?: string): WorktreeConfig;
    /**
     * Read and parse a config file with YAML frontmatter
     */
    static readConfigFile(filePath: string): Partial<WorktreeConfig>;
    /**
     * Parse YAML frontmatter from markdown content
     * Simple parser that handles the config options we care about
     */
    static parseYamlFrontmatter(content: string): Partial<WorktreeConfig>;
    /**
     * Get the default config as a template string
     */
    static getConfigTemplate(): string;
}
//# sourceMappingURL=config-reader.d.ts.map