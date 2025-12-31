import { PlanConfig, RalphConfig } from '../types';
import { TemplateFiller } from './template-filler';

/**
 * Build Claude commands for plugin execution
 */
export class CommandBuilder {
  /**
   * Build feature-dev command for planning
   */
  static buildFeatureDevCommand(config: PlanConfig): string {
    // Escape prompt for shell
    const escapedPrompt = config.prompt.replace(/'/g, "'\\''");

    return `claude skill feature-dev:feature-dev '${escapedPrompt}'`;
  }

  /**
   * Build ralph command for implementation
   */
  static buildRalphCommand(config: RalphConfig): string {
    if (!config.source_file) {
      throw new Error('Ralph config must include source_file');
    }

    return TemplateFiller.buildRalphCommand({
      template_name: config.template,
      source_file: config.source_file,
      work_on: config.work_on,
      skip_items: config.skip_items,
      max_iterations: config.max_iterations,
    });
  }

  /**
   * Build bash command to execute in worktree directory
   */
  static buildWorktreeCommand(params: {
    worktree_path: string;
    command: string;
    background?: boolean;
  }): string {
    const { worktree_path, command, background } = params;

    // Build command that changes to worktree and runs the command
    let fullCommand = `cd "${worktree_path}" && ${command}`;

    if (background) {
      // For background execution, redirect output and run in background
      fullCommand = `(${fullCommand}) > /tmp/claude-worktree-$(date +%s).log 2>&1 &`;
    }

    return fullCommand;
  }
}
