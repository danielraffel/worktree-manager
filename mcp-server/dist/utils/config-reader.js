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
exports.ConfigReader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    worktree_base_path: path.join(os.homedir(), 'worktrees'),
    branch_prefix: 'feature/',
    auto_commit: false,
    auto_push: false,
    create_learnings_file: false,
    auto_init_submodules: true,
    spec_directory: 'audit',
    default_max_iterations: 50,
};
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
class ConfigReader {
    /**
     * Get merged configuration (defaults + user overrides)
     */
    static getConfig(projectPath) {
        const userConfig = this.readConfigFile(path.join(os.homedir(), '.claude', 'worktree-manager.local.md'));
        const projectConfig = projectPath
            ? this.readConfigFile(path.join(projectPath, '.claude', 'worktree-manager.local.md'))
            : {};
        // Merge: defaults < user < project (project wins)
        const merged = {
            ...DEFAULT_CONFIG,
            ...userConfig,
            ...projectConfig,
        };
        // Expand ~ in paths
        if (merged.worktree_base_path.startsWith('~')) {
            merged.worktree_base_path = merged.worktree_base_path.replace('~', os.homedir());
        }
        return merged;
    }
    /**
     * Read and parse a config file with YAML frontmatter
     */
    static readConfigFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                return {};
            }
            const content = fs.readFileSync(filePath, 'utf-8');
            return this.parseYamlFrontmatter(content);
        }
        catch (error) {
            // Config file doesn't exist or can't be read - use defaults
            return {};
        }
    }
    /**
     * Parse YAML frontmatter from markdown content
     * Simple parser that handles the config options we care about
     */
    static parseYamlFrontmatter(content) {
        const config = {};
        // Check for frontmatter delimiters
        if (!content.startsWith('---')) {
            return config;
        }
        const endIndex = content.indexOf('---', 3);
        if (endIndex === -1) {
            return config;
        }
        const frontmatter = content.substring(3, endIndex).trim();
        const lines = frontmatter.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            // Parse based on known keys
            switch (key) {
                case 'worktree_base_path':
                    config.worktree_base_path = value;
                    break;
                case 'branch_prefix':
                    config.branch_prefix = value;
                    break;
                case 'auto_commit':
                    config.auto_commit = value === 'true';
                    break;
                case 'auto_push':
                    config.auto_push = value === 'true';
                    break;
                case 'create_learnings_file':
                    config.create_learnings_file = value === 'true';
                    break;
                case 'auto_init_submodules':
                    config.auto_init_submodules = value === 'true';
                    break;
                case 'spec_directory':
                    config.spec_directory = value;
                    break;
                case 'default_max_iterations':
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                        config.default_max_iterations = parsed;
                    }
                    break;
            }
        }
        return config;
    }
    /**
     * Get the default config as a template string
     */
    static getConfigTemplate() {
        return `---
# Worktree Manager Configuration
# Place this file at: .claude/worktree-manager.local.md (project) or ~/.claude/worktree-manager.local.md (global)

# Where to create worktrees (default: ~/worktrees)
worktree_base_path: ~/worktrees

# Branch prefix (default: feature/)
branch_prefix: feature/

# Auto-commit changes during ralph execution (default: false)
auto_commit: false

# Auto-push to remote after commits (default: false)
auto_push: false

# Create learnings.md to capture insights during development (default: false)
create_learnings_file: false

# Auto-initialize git submodules (default: true)
auto_init_submodules: true

# Directory for spec files (default: audit)
spec_directory: audit

# Max iterations for ralph (default: 50)
default_max_iterations: 50
---

# Project-Specific Notes

Add any project-specific context, conventions, or instructions here.
This content will be available to Claude during worktree operations.

# For automated workflows, use Chainer plugin:
# /chainer:run plan-and-implement --prompt="Your feature idea"
`;
    }
}
exports.ConfigReader = ConfigReader;
//# sourceMappingURL=config-reader.js.map