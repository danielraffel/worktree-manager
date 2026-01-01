import { PlanConfig, RalphConfig } from '../types';
import { TemplateFiller } from './template-filler';

/**
 * Build Claude commands for plugin execution
 */
export class CommandBuilder {
  /**
   * Escape a string for safe use in shell commands
   * Uses $'...' syntax which handles all special characters properly
   */
  static escapeForShell(str: string): string {
    // Replace backslash first, then other special chars
    return str
      .replace(/\\/g, '\\\\')     // backslash
      .replace(/'/g, "\\'")       // single quote
      .replace(/"/g, '\\"')       // double quote
      .replace(/`/g, '\\`')       // backtick (command substitution)
      .replace(/\$/g, '\\$')      // dollar sign (variable expansion)
      .replace(/!/g, '\\!')       // exclamation (history expansion)
      .replace(/\n/g, '\\n')      // newline
      .replace(/\r/g, '\\r')      // carriage return
      .replace(/\t/g, '\\t');     // tab
  }

  /**
   * Build feature-dev command for planning
   */
  static buildFeatureDevCommand(config: PlanConfig): string {
    const escapedPrompt = this.escapeForShell(config.prompt);
    return `claude skill feature-dev:feature-dev $'${escapedPrompt}'`;
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
      // For background execution, use nohup + setsid to fully detach process
      // setsid creates a new session so process survives parent exit
      const logFile = `/tmp/claude-worktree-${Date.now()}.log`;
      fullCommand = `nohup bash -c 'cd "${worktree_path}" && ${command}' > "${logFile}" 2>&1 & disown`;
    }

    return fullCommand;
  }
}
