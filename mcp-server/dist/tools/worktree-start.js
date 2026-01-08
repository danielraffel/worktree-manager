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
exports.WorktreeStartTool = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const git_helpers_1 = require("../utils/git-helpers");
const project_detector_1 = require("../utils/project-detector");
const setup_runner_1 = require("../utils/setup-runner");
const config_reader_1 = require("../utils/config-reader");
/**
 * Main tool for creating git worktrees with auto-setup
 * Refactored to be worktree-only - workflows delegated to Chainer plugin
 */
class WorktreeStartTool {
    /**
     * Create a new worktree with auto-setup
     */
    static async execute(params) {
        // Load configuration
        const cwd = process.cwd();
        const config = config_reader_1.ConfigReader.getConfig(cwd);
        // Set defaults from config
        const baseBranch = params.base_branch || 'main';
        const defaultWorktreePath = path.join(config.worktree_base_path, params.feature_name);
        const worktreePath = params.worktree_path || defaultWorktreePath;
        const branchName = `${config.branch_prefix}${params.feature_name}`;
        try {
            // Step 1: Verify we're in a git repo
            const isGitRepo = await git_helpers_1.GitHelpers.isGitRepo(cwd);
            if (!isGitRepo) {
                return {
                    success: false,
                    worktree_path: worktreePath,
                    branch: branchName,
                    setup_complete: false,
                    setup_messages: [],
                    error: 'Current directory is not a git repository',
                    next_steps: ['Navigate to a git repository and try again'],
                };
            }
            // Step 2: Create worktree (or reuse existing clean one)
            const createResult = await git_helpers_1.GitHelpers.createWorktree({
                path: worktreePath,
                branch: branchName,
                baseBranch: baseBranch,
                cwd,
            });
            let reusingExisting = false;
            if (!createResult.success) {
                // Check if worktree already exists and is clean - if so, reuse it
                if (fs.existsSync(worktreePath)) {
                    const isGitRepo = await git_helpers_1.GitHelpers.isGitRepo(worktreePath);
                    if (isGitRepo) {
                        const status = await git_helpers_1.GitHelpers.getStatus(worktreePath);
                        const isClean = status.uncommitted_changes === 0 && status.untracked_files === 0;
                        if (isClean) {
                            // Worktree exists and is clean - reuse it!
                            reusingExisting = true;
                        }
                        else {
                            // Worktree exists but has uncommitted changes
                            return {
                                success: false,
                                worktree_path: worktreePath,
                                branch: branchName,
                                setup_complete: false,
                                setup_messages: [],
                                error: `Worktree already exists with uncommitted changes: ${worktreePath}`,
                                next_steps: [
                                    'Commit or stash changes in existing worktree',
                                    'Or use /worktree-manager:cleanup to remove it',
                                    'Or try a different feature name',
                                ],
                            };
                        }
                    }
                }
                // If we're not reusing, return the original error
                if (!reusingExisting) {
                    return {
                        success: false,
                        worktree_path: worktreePath,
                        branch: branchName,
                        setup_complete: false,
                        setup_messages: [],
                        error: createResult.error,
                        next_steps: [
                            'Check if worktree path already exists',
                            'Check if branch name already exists',
                            'Try a different feature name',
                        ],
                    };
                }
            }
            // Step 3: Detect project type
            const projectInfo = project_detector_1.ProjectDetector.detect(worktreePath);
            // Step 3.5: Initialize submodules if present and configured
            let submoduleSuccess;
            let submoduleError;
            if (config.auto_init_submodules && !reusingExisting) {
                const hasSubmodules = git_helpers_1.GitHelpers.hasSubmodules(cwd);
                if (hasSubmodules) {
                    // Note: We'll add this message to setupMessages below
                    const submoduleResult = await git_helpers_1.GitHelpers.initSubmodules(worktreePath);
                    // Store result to add to messages later
                    submoduleSuccess = submoduleResult.success;
                    submoduleError = submoduleResult.error;
                }
            }
            // Step 4: Run setup commands
            const setupMessages = reusingExisting
                ? [
                    `♻️  Reusing existing clean worktree: ${worktreePath}`,
                    `Branch: ${branchName}`,
                    `Project type: ${projectInfo.type}`,
                ]
                : [
                    `Worktree created: ${worktreePath}`,
                    `Branch: ${branchName} (from ${baseBranch})`,
                    `Project type: ${projectInfo.type}`,
                ];
            let setupComplete = true;
            if (reusingExisting) {
                // Skip setup when reusing - already done
                setupMessages.push('Skipping setup (already configured)');
            }
            else {
                // Add submodule initialization messages if applicable
                if (config.auto_init_submodules && git_helpers_1.GitHelpers.hasSubmodules(cwd)) {
                    setupMessages.push('Detected git submodules, initializing...');
                    if (typeof submoduleSuccess !== 'undefined' && submoduleSuccess) {
                        setupMessages.push('✅ Git submodules initialized');
                    }
                    else if (typeof submoduleError !== 'undefined') {
                        setupMessages.push(`⚠️  Submodule initialization failed: ${submoduleError}`);
                        setupMessages.push('You may need to run: git submodule update --init --recursive');
                    }
                }
                if (projectInfo.setup_commands.length > 0) {
                    setupMessages.push('Running setup commands...');
                    const setupResult = await setup_runner_1.SetupRunner.runSetupCommands(projectInfo.setup_commands);
                    setupMessages.push(...setupResult.messages);
                    if (!setupResult.success) {
                        setupComplete = false;
                        setupMessages.push(...setupResult.errors);
                    }
                }
                else {
                    setupMessages.push('No setup commands needed');
                }
            }
            // Step 4.5: Create learnings file if configured (skip if reusing and file exists)
            if (config.create_learnings_file) {
                const learningsPath = path.join(worktreePath, 'LEARNINGS.md');
                if (reusingExisting && fs.existsSync(learningsPath)) {
                    // Skip - already exists
                }
                else {
                    const learningsContent = `# Learnings - ${params.feature_name}

## Overview
This file captures insights, decisions, and learnings during development.

## Key Decisions

## Challenges & Solutions

## What Worked Well

## What Could Be Improved

## Notes

---
*Created by worktree-manager on ${new Date().toISOString()}*
`;
                    try {
                        fs.writeFileSync(learningsPath, learningsContent);
                        setupMessages.push(`Created LEARNINGS.md for capturing insights`);
                    }
                    catch (e) {
                        setupMessages.push(`Warning: Could not create LEARNINGS.md`);
                    }
                }
            }
            // Step 5: Return success with Chainer suggestion
            return this.buildSuccessResult({
                worktreePath,
                branchName,
                setupMessages,
                setupComplete,
            });
        }
        catch (error) {
            return {
                success: false,
                worktree_path: worktreePath,
                branch: branchName,
                setup_complete: false,
                setup_messages: [],
                error: error.message || 'Unknown error creating worktree',
                next_steps: ['Check error message above', 'Verify git and npm are installed'],
            };
        }
    }
    /**
     * Build success result with Chainer detection and suggestions
     */
    static buildSuccessResult(options) {
        const { worktreePath, branchName, setupMessages, setupComplete } = options;
        // Check if Chainer is installed
        const homeDir = os.homedir();
        const chainerPaths = [
            path.join(homeDir, '.claude', 'plugins', 'chainer'),
            path.join(homeDir, 'Code', 'Chainer'),
        ];
        let chainerInstalled = false;
        for (const chainerPath of chainerPaths) {
            if (fs.existsSync(path.join(chainerPath, 'plugin', '.claude-plugin', 'plugin.json'))) {
                chainerInstalled = true;
                break;
            }
        }
        setupMessages.push('');
        const nextSteps = [];
        if (setupComplete) {
            nextSteps.push('✅ Worktree created successfully!');
            nextSteps.push(`📁 Path: ${worktreePath}`);
            nextSteps.push(`🌿 Branch: ${branchName}`);
            nextSteps.push('');
            if (chainerInstalled) {
                // Chainer detected - suggest using it for automated workflows
                nextSteps.push('🔗 Chainer detected! For automated development:');
                nextSteps.push('');
                nextSteps.push('  # Full workflow (plan + implement)');
                nextSteps.push(`  /chainer:run plan-and-implement \\`);
                nextSteps.push(`    --cwd="${worktreePath}" \\`);
                nextSteps.push(`    --prompt="Your feature idea" \\`);
                nextSteps.push(`    --feature_name="${path.basename(worktreePath)}"`);
                nextSteps.push('');
                nextSteps.push('  # Or just planning');
                nextSteps.push(`  /chainer:run plan-only --cwd="${worktreePath}" --prompt="Your idea"`);
                nextSteps.push('');
                nextSteps.push('  # Or manual development');
                nextSteps.push(`  cd ${worktreePath} && claude`);
            }
            else {
                // Chainer not installed - suggest manual workflow
                nextSteps.push('Next steps:');
                nextSteps.push(`  cd ${worktreePath}`);
                nextSteps.push('  claude');
                nextSteps.push('');
                nextSteps.push('💡 For automated workflows, install Chainer:');
                nextSteps.push('   git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer');
                nextSteps.push('');
                nextSteps.push('   Then use:');
                nextSteps.push('   /chainer:run plan-and-implement --prompt="Your idea" --feature_name="name"');
            }
        }
        else {
            nextSteps.push('⚠️ Worktree created but setup incomplete');
            nextSteps.push('');
            nextSteps.push('Fix setup issues:');
            nextSteps.push(`  cd ${worktreePath}`);
            nextSteps.push('  npm install  # or appropriate setup command');
        }
        return {
            success: true,
            worktree_path: worktreePath,
            branch: branchName,
            setup_complete: setupComplete,
            setup_messages: setupMessages,
            next_steps: nextSteps,
        };
    }
}
exports.WorktreeStartTool = WorktreeStartTool;
//# sourceMappingURL=worktree-start.js.map