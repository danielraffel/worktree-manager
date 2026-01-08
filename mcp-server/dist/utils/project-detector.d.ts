import { ProjectDetectionResult } from '../types';
/**
 * Project detection utility
 * Detects project type (web/iOS/full-stack) and determines setup commands
 */
export declare class ProjectDetector {
    /**
     * Detect project type and return setup commands
     */
    static detect(worktreePath: string): ProjectDetectionResult;
    /**
     * Check if project has web/ directory with package.json
     */
    private static hasWebProject;
    /**
     * Check if project has ios/ directory
     */
    private static hasIosProject;
    /**
     * Check if project has package.json at root
     */
    private static hasRootPackageJson;
    /**
     * Generate setup commands based on detected project structure
     */
    private static getSetupCommands;
}
//# sourceMappingURL=project-detector.d.ts.map