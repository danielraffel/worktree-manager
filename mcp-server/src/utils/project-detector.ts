import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetectionResult, ProjectType, SetupCommand } from '../types';

/**
 * Project detection utility
 * Detects project type (web/iOS/full-stack) and determines setup commands
 */
export class ProjectDetector {
  /**
   * Detect project type and return setup commands
   */
  static detect(worktreePath: string): ProjectDetectionResult {
    const hasWeb = this.hasWebProject(worktreePath);
    const hasIos = this.hasIosProject(worktreePath);
    const hasRootPackageJson = this.hasRootPackageJson(worktreePath);

    let type: ProjectType;
    if (hasWeb && hasIos) {
      type = 'full-stack';
    } else if (hasWeb) {
      type = 'web';
    } else if (hasIos) {
      type = 'ios';
    } else {
      type = 'unknown';
    }

    const setupCommands = this.getSetupCommands({
      worktreePath,
      hasWeb,
      hasIos,
      hasRootPackageJson,
    });

    return {
      type,
      setup_commands: setupCommands,
      details: {
        has_web: hasWeb,
        has_ios: hasIos,
        has_root_package_json: hasRootPackageJson,
      },
    };
  }

  /**
   * Check if project has web/ directory with package.json
   */
  private static hasWebProject(worktreePath: string): boolean {
    const webPackageJson = path.join(worktreePath, 'web', 'package.json');
    return fs.existsSync(webPackageJson);
  }

  /**
   * Check if project has ios/ directory
   */
  private static hasIosProject(worktreePath: string): boolean {
    const iosDir = path.join(worktreePath, 'ios');
    return fs.existsSync(iosDir) && fs.statSync(iosDir).isDirectory();
  }

  /**
   * Check if project has package.json at root
   */
  private static hasRootPackageJson(worktreePath: string): boolean {
    const rootPackageJson = path.join(worktreePath, 'package.json');
    return fs.existsSync(rootPackageJson);
  }

  /**
   * Generate setup commands based on detected project structure
   */
  private static getSetupCommands(params: {
    worktreePath: string;
    hasWeb: boolean;
    hasIos: boolean;
    hasRootPackageJson: boolean;
  }): SetupCommand[] {
    const commands: SetupCommand[] = [];

    // Web project setup
    if (params.hasWeb) {
      commands.push({
        directory: path.join(params.worktreePath, 'web'),
        command: 'npm install',
        description: 'Install web dependencies',
      });
    }

    // Root package.json setup (if exists and no web/)
    if (params.hasRootPackageJson && !params.hasWeb) {
      commands.push({
        directory: params.worktreePath,
        command: 'npm install',
        description: 'Install dependencies',
      });
    }

    // iOS project setup (note: usually manual in Xcode)
    if (params.hasIos && !params.hasWeb) {
      commands.push({
        directory: params.worktreePath,
        command: 'echo "iOS project detected. Open in Xcode if needed."',
        description: 'iOS project setup (manual)',
      });
    }

    return commands;
  }
}
