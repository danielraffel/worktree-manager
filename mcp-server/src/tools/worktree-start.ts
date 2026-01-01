import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { WorktreeStartParams, WorktreeStartResult, WorkflowMode } from '../types';
import { GitHelpers } from '../utils/git-helpers';
import { ProjectDetector } from '../utils/project-detector';
import { SetupRunner } from '../utils/setup-runner';
import { CommandBuilder } from '../utils/command-builder';
import { ConfigReader, WorktreeConfig } from '../utils/config-reader';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Main tool for creating git worktrees with auto-setup and plugin integration
 * Supports all workflow modes: simple, plan-only, implement-only, plan-and-implement
 */
export class WorktreeStartTool {
  /**
   * Create a new worktree with optional automation
   */
  static async execute(params: WorktreeStartParams): Promise<WorktreeStartResult> {
    // Load configuration
    const cwd = process.cwd();
    const config = ConfigReader.getConfig(cwd);

    // Set defaults from config
    const baseBranch = params.base_branch || 'main';
    const workflow = params.workflow || config.default_workflow;
    const defaultWorktreePath = path.join(
      config.worktree_base_path,
      params.feature_name
    );
    const worktreePath = params.worktree_path || defaultWorktreePath;
    const branchName = `${config.branch_prefix}${params.feature_name}`;

    try {
      // Step 1: Verify we're in a git repo
      const isGitRepo = await GitHelpers.isGitRepo(cwd);
      if (!isGitRepo) {
        return {
          success: false,
          worktree_path: worktreePath,
          branch: branchName,
          workflow,
          setup_complete: false,
          setup_messages: [],
          error: 'Current directory is not a git repository',
          next_steps: ['Navigate to a git repository and try again'],
        };
      }

      // Step 2: Create worktree (or reuse existing clean one)
      const createResult = await GitHelpers.createWorktree({
        path: worktreePath,
        branch: branchName,
        baseBranch: baseBranch,
        cwd,
      });

      let reusingExisting = false;
      if (!createResult.success) {
        // Check if worktree already exists and is clean - if so, reuse it
        if (fs.existsSync(worktreePath)) {
          const isGitRepo = await GitHelpers.isGitRepo(worktreePath);
          if (isGitRepo) {
            const status = await GitHelpers.getStatus(worktreePath);
            const isClean = status.uncommitted_changes === 0 && status.untracked_files === 0;

            if (isClean) {
              // Worktree exists and is clean - reuse it!
              reusingExisting = true;
            } else {
              // Worktree exists but has uncommitted changes
              return {
                success: false,
                worktree_path: worktreePath,
                branch: branchName,
                workflow,
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
            workflow,
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
      const projectInfo = ProjectDetector.detect(worktreePath);

      // Step 4: Run setup commands
      const setupMessages: string[] = reusingExisting
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
      } else if (projectInfo.setup_commands.length > 0) {
        setupMessages.push('Running setup commands...');

        const setupResult = await SetupRunner.runSetupCommands(projectInfo.setup_commands);
        setupMessages.push(...setupResult.messages);

        if (!setupResult.success) {
          setupComplete = false;
          setupMessages.push(...setupResult.errors);
        }
      } else {
        setupMessages.push('No setup commands needed');
      }

      // Step 4.5: Create learnings file if configured (skip if reusing and file exists)
      if (config.create_learnings_file) {
        const learningsPath = path.join(worktreePath, 'LEARNINGS.md');
        if (reusingExisting && fs.existsSync(learningsPath)) {
          // Skip - already exists
        } else {
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
          } catch (e) {
            setupMessages.push(`Warning: Could not create LEARNINGS.md`);
          }
        }
      }

      // Step 5: Execute workflow-specific logic
      const result = await this.executeWorkflow({
        workflow,
        worktreePath,
        branchName,
        params,
        setupMessages,
        setupComplete,
        config,
      });

      return result;
    } catch (error: any) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow,
        setup_complete: false,
        setup_messages: [],
        error: error.message || 'Unknown error creating worktree',
        next_steps: ['Check error message above', 'Verify git and npm are installed'],
      };
    }
  }

  /**
   * Execute workflow-specific logic
   */
  private static async executeWorkflow(options: {
    workflow: WorkflowMode | string;
    worktreePath: string;
    branchName: string;
    params: WorktreeStartParams;
    setupMessages: string[];
    setupComplete: boolean;
    config: WorktreeConfig;
  }): Promise<WorktreeStartResult> {
    const { workflow, worktreePath, branchName, params, setupMessages, setupComplete, config } = options;

    switch (workflow) {
      case 'simple':
        return this.executeSimpleWorkflow({
          worktreePath,
          branchName,
          params,
          setupMessages,
          setupComplete,
        });

      case 'plan-only':
        return this.executePlanOnlyWorkflow({
          worktreePath,
          branchName,
          params,
          setupMessages,
          setupComplete,
          config,
        });

      case 'implement-only':
        return this.executeImplementOnlyWorkflow({
          worktreePath,
          branchName,
          params,
          setupMessages,
          setupComplete,
          config,
        });

      case 'plan-and-implement':
        return this.executePlanAndImplementWorkflow({
          worktreePath,
          branchName,
          params,
          config,
          setupMessages,
          setupComplete,
        });

      default:
        return {
          success: false,
          worktree_path: worktreePath,
          branch: branchName,
          workflow: workflow as WorkflowMode,
          setup_complete: setupComplete,
          setup_messages: setupMessages,
          error: `Unknown workflow: ${workflow}`,
          next_steps: ['Use one of: simple, plan-only, implement-only, plan-and-implement'],
        };
    }
  }

  /**
   * Simple workflow: Just create worktree, no plugins
   */
  private static async executeSimpleWorkflow(options: {
    worktreePath: string;
    branchName: string;
    params: WorktreeStartParams;
    setupMessages: string[];
    setupComplete: boolean;
  }): Promise<WorktreeStartResult> {
    const { worktreePath, branchName, params, setupMessages, setupComplete } = options;

    const nextSteps: string[] = [];
    if (setupComplete) {
      nextSteps.push('Worktree is ready to use!');
      nextSteps.push('Open new terminal and navigate:');
      nextSteps.push(`  cd ${worktreePath}`);
      nextSteps.push('  claude');
      if (params.task_description) {
        nextSteps.push('');
        nextSteps.push(`Task: ${params.task_description}`);
      }
    } else {
      nextSteps.push('Worktree created but setup incomplete');
      nextSteps.push('Fix setup issues manually:');
      nextSteps.push(`  cd ${worktreePath}`);
      nextSteps.push('  npm install (or appropriate setup command)');
    }

    return {
      success: true,
      worktree_path: worktreePath,
      branch: branchName,
      workflow: 'simple',
      setup_complete: setupComplete,
      setup_messages: setupMessages,
      next_steps: nextSteps,
    };
  }

  /**
   * Plan-only workflow: Create + run feature-dev
   */
  private static async executePlanOnlyWorkflow(options: {
    worktreePath: string;
    branchName: string;
    params: WorktreeStartParams;
    setupMessages: string[];
    setupComplete: boolean;
    config: WorktreeConfig;
  }): Promise<WorktreeStartResult> {
    const { worktreePath, branchName, params, setupMessages, setupComplete, config } = options;

    if (!params.plan_config) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'plan-only',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        error: 'plan-only workflow requires plan_config parameter',
        next_steps: ['Provide plan_config with prompt field'],
      };
    }

    // Build feature-dev command
    const featureDevCmd = CommandBuilder.buildFeatureDevCommand(params.plan_config);

    // Default spec file location (uses config.spec_directory)
    const specFile =
      params.plan_config.save_to || path.join(config.spec_directory, `${params.feature_name}.md`);
    const specFilePath = path.join(worktreePath, specFile);

    // Build full command to run in worktree
    const fullCommand = CommandBuilder.buildWorktreeCommand({
      worktree_path: worktreePath,
      command: `${featureDevCmd} > "${specFile}"`,
      background: false,
    });

    setupMessages.push('');
    setupMessages.push('Phase: Planning with feature-dev');
    setupMessages.push(`Running: ${featureDevCmd}`);
    setupMessages.push(`Saving to: ${specFile}`);

    // Execute feature-dev (synchronously)
    try {
      await execAsync(fullCommand, { cwd: worktreePath });
      setupMessages.push('✅ feature-dev completed successfully');
    } catch (error: any) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'plan-only',
        setup_complete: setupComplete,
        setup_messages: [...setupMessages, `❌ feature-dev failed: ${error.message}`],
        error: `feature-dev execution failed: ${error.message}`,
        next_steps: ['Check feature-dev plugin is installed', 'Try running manually'],
      };
    }

    const nextSteps = [
      'Planning complete!',
      `Spec saved to: ${specFile}`,
      '',
      'Next options:',
      'A) Implement manually:',
      `   cd ${worktreePath} && claude`,
      '',
      'B) Have ralph implement:',
      `   worktree_start({`,
      `     feature_name: "${params.feature_name}",`,
      `     workflow: "implement-only",`,
      `     ralph_config: { source_file: "${specFile}" }`,
      `   })`,
    ];

    return {
      success: true,
      worktree_path: worktreePath,
      branch: branchName,
      workflow: 'plan-only',
      setup_complete: setupComplete,
      setup_messages: setupMessages,
      spec_file: specFilePath,
      next_steps: nextSteps,
    };
  }

  /**
   * Implement-only workflow: Create + run ralph
   */
  private static async executeImplementOnlyWorkflow(options: {
    worktreePath: string;
    branchName: string;
    params: WorktreeStartParams;
    setupMessages: string[];
    setupComplete: boolean;
    config: WorktreeConfig;
  }): Promise<WorktreeStartResult> {
    const { worktreePath, branchName, params, setupMessages, setupComplete, config } = options;

    if (!params.ralph_config) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'implement-only',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        error: 'implement-only workflow requires ralph_config parameter',
        next_steps: ['Provide ralph_config with source_file field'],
      };
    }

    if (!params.ralph_config.source_file) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'implement-only',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        error: 'ralph_config must include source_file',
        next_steps: ['Provide ralph_config.source_file (e.g., "audit/feature.md")'],
      };
    }

    // Apply config defaults to ralph_config
    const ralphConfigWithDefaults = {
      ...params.ralph_config,
      max_iterations: params.ralph_config.max_iterations || config.default_max_iterations,
    };

    // Build ralph command
    const ralphCmd = CommandBuilder.buildRalphCommand(ralphConfigWithDefaults);

    // Determine execution mode - default to manual since background doesn't work reliably
    // (claude is an interactive terminal app that can't be fully backgrounded)
    const executionMode = ralphConfigWithDefaults.execution_mode || 'manual';
    const isBackground = executionMode === 'background';

    setupMessages.push('');
    setupMessages.push('Phase: Implementation with ralph-wiggum');
    setupMessages.push(`Source: ${ralphConfigWithDefaults.source_file}`);
    if (ralphConfigWithDefaults.work_on) {
      setupMessages.push(`Working on: ${ralphConfigWithDefaults.work_on.join(', ')}`);
    }
    if (ralphConfigWithDefaults.skip_items) {
      setupMessages.push(`Skipping: ${ralphConfigWithDefaults.skip_items.join(', ')}`);
    }
    setupMessages.push(`Max iterations: ${ralphConfigWithDefaults.max_iterations}`);
    setupMessages.push(`Execution mode: ${executionMode}`);

    if (isBackground) {
      // Build background command
      const fullCommand = CommandBuilder.buildWorktreeCommand({
        worktree_path: worktreePath,
        command: ralphCmd,
        background: true,
      });

      try {
        const { stdout } = await execAsync(fullCommand, { cwd: worktreePath });
        const taskId = `ralph_${Date.now()}`;

        setupMessages.push(`🤖 ralph-wiggum started in background (${taskId})`);

        const nextSteps = [
          'Implementation running in background!',
          '',
          `Monitor with: tail -f /tmp/claude-worktree-*.log`,
          `Or cd ${worktreePath} && git log`,
          '',
          'Ralph is implementing features from spec.',
          'This may take several hours depending on scope.',
          '',
          'You can continue working elsewhere!',
        ];

        return {
          success: true,
          worktree_path: worktreePath,
          branch: branchName,
          workflow: 'implement-only',
          setup_complete: setupComplete,
          setup_messages: setupMessages,
          task_id: taskId,
          next_steps: nextSteps,
        };
      } catch (error: any) {
        return {
          success: false,
          worktree_path: worktreePath,
          branch: branchName,
          workflow: 'implement-only',
          setup_complete: setupComplete,
          setup_messages: [...setupMessages, `❌ ralph failed to start: ${error.message}`],
          error: `ralph execution failed: ${error.message}`,
          next_steps: ['Check ralph-wiggum plugin is installed', 'Try running manually'],
        };
      }
    } else {
      // Manual execution - provide clear terminal commands
      const nextSteps = [
        '🎯 Worktree ready for implementation!',
        '',
        'Open a NEW terminal and run:',
        `  cd ${worktreePath} && claude`,
        '',
        'Then start ralph with:',
        `  /ralph-wiggum:ralph-loop`,
        '',
        `Spec file: ${ralphConfigWithDefaults.source_file}`,
      ];

      return {
        success: true,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'implement-only',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        spec_file: ralphConfigWithDefaults.source_file,
        ralph_command: '/ralph-wiggum:ralph-loop',
        next_steps: nextSteps,
      };
    }
  }

  /**
   * Plan-and-implement workflow: Create + feature-dev + ralph
   */
  private static async executePlanAndImplementWorkflow(options: {
    worktreePath: string;
    branchName: string;
    params: WorktreeStartParams;
    setupMessages: string[];
    setupComplete: boolean;
    config: WorktreeConfig;
  }): Promise<WorktreeStartResult> {
    const { worktreePath, branchName, params, setupMessages, setupComplete, config } = options;

    if (!params.plan_config) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'plan-and-implement',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        error: 'plan-and-implement workflow requires plan_config parameter',
        next_steps: ['Provide plan_config with prompt field'],
      };
    }

    if (!params.ralph_config) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'plan-and-implement',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        error: 'plan-and-implement workflow requires ralph_config parameter',
        next_steps: ['Provide ralph_config (source_file will be auto-filled from plan)'],
      };
    }

    // Phase 1: Run feature-dev
    setupMessages.push('');
    setupMessages.push('=== Phase 1: Planning with feature-dev ===');

    const specFile =
      params.plan_config.save_to || path.join(config.spec_directory, `${params.feature_name}.md`);
    const specFilePath = path.join(worktreePath, specFile);

    // Ensure spec directory exists
    const specDir = path.join(worktreePath, config.spec_directory);
    if (!fs.existsSync(specDir)) {
      fs.mkdirSync(specDir, { recursive: true });
    }

    const featureDevCmd = CommandBuilder.buildFeatureDevCommand(params.plan_config);
    const fullFeatureDevCommand = CommandBuilder.buildWorktreeCommand({
      worktree_path: worktreePath,
      command: `${featureDevCmd} > "${specFile}"`,
      background: false,
    });

    setupMessages.push(`Running: ${featureDevCmd}`);
    setupMessages.push(`Saving to: ${specFile}`);

    try {
      await execAsync(fullFeatureDevCommand, { cwd: worktreePath });
      setupMessages.push('✅ feature-dev completed successfully');
      setupMessages.push(`✅ Spec saved to: ${specFile}`);
    } catch (error: any) {
      return {
        success: false,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'plan-and-implement',
        setup_complete: setupComplete,
        setup_messages: [...setupMessages, `❌ feature-dev failed: ${error.message}`],
        spec_file: specFilePath,
        error: `feature-dev execution failed: ${error.message}`,
        next_steps: ['Check feature-dev plugin is installed', 'Try plan-only workflow instead'],
      };
    }

    // Phase 2: Run ralph
    setupMessages.push('');
    setupMessages.push('=== Phase 2: Implementation with ralph-wiggum ===');

    // Auto-fill source_file from plan and apply config defaults
    const ralphConfig = {
      ...params.ralph_config,
      source_file: params.ralph_config.source_file || specFile,
      max_iterations: params.ralph_config.max_iterations || config.default_max_iterations,
    };

    const ralphCmd = CommandBuilder.buildRalphCommand(ralphConfig);
    // Default to manual since background doesn't work reliably
    const executionMode = ralphConfig.execution_mode || 'manual';
    const isBackground = executionMode === 'background';

    setupMessages.push(`Source: ${ralphConfig.source_file}`);
    if (ralphConfig.work_on) {
      setupMessages.push(`Working on: ${ralphConfig.work_on.join(', ')}`);
    }
    if (ralphConfig.skip_items) {
      setupMessages.push(`Skipping: ${ralphConfig.skip_items.join(', ')}`);
    }
    setupMessages.push(`Max iterations: ${ralphConfig.max_iterations || 50}`);
    setupMessages.push(`Execution mode: ${executionMode}`);

    if (isBackground) {
      const fullRalphCommand = CommandBuilder.buildWorktreeCommand({
        worktree_path: worktreePath,
        command: ralphCmd,
        background: true,
      });

      try {
        await execAsync(fullRalphCommand, { cwd: worktreePath });
        const taskId = `ralph_${Date.now()}`;

        setupMessages.push(`🤖 ralph-wiggum started in background (${taskId})`);

        const nextSteps = [
          '🎉 Full automation complete!',
          '',
          'Phase 1: Planning ✅',
          `  - Spec created: ${specFile}`,
          '',
          'Phase 2: Implementation 🚀',
          `  - ralph is running in background (${taskId})`,
          `  - Monitor: tail -f /tmp/claude-worktree-*.log`,
          `  - Or: cd ${worktreePath} && git log`,
          '',
          'Ralph is implementing features from spec.',
          'This may take several hours depending on scope.',
          '',
          'You can continue working elsewhere!',
        ];

        return {
          success: true,
          worktree_path: worktreePath,
          branch: branchName,
          workflow: 'plan-and-implement',
          setup_complete: setupComplete,
          setup_messages: setupMessages,
          spec_file: specFilePath,
          task_id: taskId,
          next_steps: nextSteps,
        };
      } catch (error: any) {
        return {
          success: true, // Planning succeeded
          worktree_path: worktreePath,
          branch: branchName,
          workflow: 'plan-and-implement',
          setup_complete: setupComplete,
          setup_messages: [...setupMessages, `❌ ralph failed to start: ${error.message}`],
          spec_file: specFilePath,
          error: `ralph execution failed (planning succeeded): ${error.message}`,
          next_steps: [
            `Spec created successfully: ${specFile}`,
            'Ralph failed to start - run manually:',
            `  cd ${worktreePath}`,
            `  ${ralphCmd}`,
          ],
        };
      }
    } else {
      const nextSteps = [
        '🎯 Planning complete! Worktree ready for implementation.',
        '',
        `Spec saved to: ${specFile}`,
        '',
        'Open a NEW terminal and run:',
        `  cd ${worktreePath} && claude`,
        '',
        'Then start ralph with:',
        `  /ralph-wiggum:ralph-loop`,
        '',
        'Ralph will implement from the generated spec.',
      ];

      return {
        success: true,
        worktree_path: worktreePath,
        branch: branchName,
        workflow: 'plan-and-implement',
        setup_complete: setupComplete,
        setup_messages: setupMessages,
        spec_file: specFilePath,
        ralph_command: '/ralph-wiggum:ralph-loop',
        next_steps: nextSteps,
      };
    }
  }
}
