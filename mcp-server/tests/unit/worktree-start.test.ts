import { WorktreeStartTool } from '../../src/tools/worktree-start';
import { GitHelpers } from '../../src/utils/git-helpers';
import { ProjectDetector } from '../../src/utils/project-detector';
import { SetupRunner } from '../../src/utils/setup-runner';
import * as os from 'os';
import * as path from 'path';

jest.mock('../../src/utils/git-helpers');
jest.mock('../../src/utils/project-detector');
jest.mock('../../src/utils/setup-runner');

describe('WorktreeStartTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - simple workflow', () => {
    it('should create worktree successfully with default parameters', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [
          {
            directory: '/path/to/worktree/web',
            command: 'npm install',
            description: 'Install web dependencies',
          },
        ],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });
      (SetupRunner.runSetupCommands as jest.Mock).mockResolvedValue({
        success: true,
        messages: ['✅ Install web dependencies complete'],
        errors: [],
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
      });

      expect(result.success).toBe(true);
      expect(result.branch).toBe('feature/test-feature');
      expect(result.workflow).toBe('simple');
      expect(result.setup_complete).toBe(true);
      expect(result.worktree_path).toBe(
        path.join(os.homedir(), 'worktrees', 'test-feature')
      );
      expect(result.next_steps[0]).toContain('ready to use');
    });

    it('should use custom worktree path when provided', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });

      const customPath = '/custom/path/to/worktree';
      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
        worktree_path: customPath,
      });

      expect(result.worktree_path).toBe(customPath);
      expect(GitHelpers.createWorktree).toHaveBeenCalledWith({
        path: customPath,
        branch: 'feature/test-feature',
        baseBranch: 'main',
        cwd: expect.any(String),
      });
    });

    it('should use custom base branch when provided', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
        base_branch: 'develop',
      });

      expect(GitHelpers.createWorktree).toHaveBeenCalledWith(
        expect.objectContaining({
          baseBranch: 'develop',
        })
      );
    });

    it('should fail when not in a git repository', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(false);

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a git repository');
      expect(result.next_steps[0]).toContain('Navigate to a git repository');
    });

    it('should fail when worktree creation fails', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Branch already exists',
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Branch already exists');
      expect(result.next_steps).toContain('Try a different feature name');
    });

    it('should mark setup as incomplete when setup commands fail', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [
          {
            directory: '/path/to/worktree/web',
            command: 'npm install',
            description: 'Install web dependencies',
          },
        ],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });
      (SetupRunner.runSetupCommands as jest.Mock).mockResolvedValue({
        success: false,
        messages: ['Running: npm install'],
        errors: ['❌ npm install failed'],
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
      });

      expect(result.success).toBe(true); // Worktree created successfully
      expect(result.setup_complete).toBe(false); // But setup failed
      expect(result.next_steps[0]).toContain('setup incomplete');
      expect(result.setup_messages).toContain('❌ npm install failed');
    });

    it('should include task description in next steps when provided', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
        task_description: 'Implement user authentication',
      });

      expect(result.next_steps.join('\n')).toContain('Implement user authentication');
    });

    it('should handle unknown project type with no setup commands', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'unknown',
        setup_commands: [],
        details: { has_web: false, has_ios: false, has_root_package_json: false },
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
      });

      expect(result.success).toBe(true);
      expect(result.setup_complete).toBe(true);
      expect(result.setup_messages).toContain('No setup commands needed');
    });

    it('should handle unexpected errors gracefully', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error');
    });
  });

  describe('execute - advanced workflows validation', () => {
    it('should require plan_config for plan-only workflow', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
        workflow: 'plan-only',
        // Missing plan_config
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('plan_config');
    });

    it('should require ralph_config for implement-only workflow', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
        workflow: 'implement-only',
        // Missing ralph_config
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ralph_config');
    });

    it('should require both plan_config and ralph_config for plan-and-implement workflow', async () => {
      (GitHelpers.isGitRepo as jest.Mock).mockResolvedValue(true);
      (GitHelpers.createWorktree as jest.Mock).mockResolvedValue({ success: true });
      (ProjectDetector.detect as jest.Mock).mockReturnValue({
        type: 'web',
        setup_commands: [],
        details: { has_web: true, has_ios: false, has_root_package_json: false },
      });

      const result = await WorktreeStartTool.execute({
        feature_name: 'test-feature',
        workflow: 'plan-and-implement',
        // Missing both configs
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('plan_config');
    });
  });
});
