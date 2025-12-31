import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetector } from '../../src/utils/project-detector';

jest.mock('fs');

describe('ProjectDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detect', () => {
    it('should detect web project', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('web/package.json')) return true;
        return false;
      });

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.type).toBe('web');
      expect(result.details.has_web).toBe(true);
      expect(result.details.has_ios).toBe(false);
      expect(result.setup_commands).toHaveLength(1);
      expect(result.setup_commands[0]).toEqual({
        directory: path.join('/path/to/worktree', 'web'),
        command: 'npm install',
        description: 'Install web dependencies',
      });
    });

    it('should detect iOS project', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('ios')) return true;
        return false;
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.type).toBe('ios');
      expect(result.details.has_web).toBe(false);
      expect(result.details.has_ios).toBe(true);
      expect(result.setup_commands).toHaveLength(1);
      expect(result.setup_commands[0]).toEqual({
        directory: '/path/to/worktree',
        command: 'echo "iOS project detected. Open in Xcode if needed."',
        description: 'iOS project setup (manual)',
      });
    });

    it('should detect full-stack project', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('web/package.json')) return true;
        if (filePath.endsWith('ios')) return true;
        return false;
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.type).toBe('full-stack');
      expect(result.details.has_web).toBe(true);
      expect(result.details.has_ios).toBe(true);
      expect(result.setup_commands).toHaveLength(1);
      expect(result.setup_commands[0]).toEqual({
        directory: path.join('/path/to/worktree', 'web'),
        command: 'npm install',
        description: 'Install web dependencies',
      });
    });

    it('should detect root package.json project (no web/)', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('package.json') && !filePath.includes('web')) return true;
        return false;
      });

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.type).toBe('unknown');
      expect(result.details.has_root_package_json).toBe(true);
      expect(result.setup_commands).toHaveLength(1);
      expect(result.setup_commands[0]).toEqual({
        directory: '/path/to/worktree',
        command: 'npm install',
        description: 'Install dependencies',
      });
    });

    it('should return unknown type when no project structure detected', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.type).toBe('unknown');
      expect(result.details.has_web).toBe(false);
      expect(result.details.has_ios).toBe(false);
      expect(result.details.has_root_package_json).toBe(false);
      expect(result.setup_commands).toHaveLength(0);
    });

    it('should prioritize web setup over root package.json', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true); // All files exist

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.setup_commands).toHaveLength(1);
      expect(result.setup_commands[0].directory).toContain('web');
    });

    it('should not include iOS setup command when web exists', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('web/package.json')) return true;
        if (filePath.endsWith('ios')) return true;
        return false;
      });
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });

      const result = ProjectDetector.detect('/path/to/worktree');

      expect(result.type).toBe('full-stack');
      expect(result.setup_commands).toHaveLength(1);
      expect(result.setup_commands[0].description).toBe('Install web dependencies');
    });
  });
});
