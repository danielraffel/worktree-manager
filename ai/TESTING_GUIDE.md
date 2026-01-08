# Testing Guide

This guide explains how to run tests, write new tests, and understand the testing architecture for worktree-manager.

## Test Organization

```
mcp-server/tests/
├── unit/                           # Unit tests for individual components
│   ├── config-reader.test.ts      # Configuration parsing
│   ├── file-copier.test.ts        # File copying patterns
│   ├── git-helpers.test.ts        # Git operations
│   └── project-detector.test.ts   # Project type detection
└── integration/                    # Integration tests (future)
    └── worktree-lifecycle.test.ts
```

---

## Running Tests

### Run All Tests
```bash
cd mcp-server
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test -- config-reader.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

**Coverage Target**: 99%+ maintained across all phases

---

## Test Stack

- **Framework**: Jest
- **Mocking**: Jest built-in mocks for `fs` and `child_process`
- **Assertions**: Jest expect matchers
- **TypeScript**: ts-jest for TypeScript support

---

## Writing Unit Tests

### Basic Test Structure

```typescript
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test-input';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected-output');
  });
});
```

### Mocking File System

```typescript
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  copyFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// In test
beforeEach(() => {
  (fs.existsSync as jest.Mock).mockReturnValue(true);
  (fs.readFileSync as jest.Mock).mockReturnValue('file content');
});
```

### Mocking Git Commands

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockExec = exec as unknown as jest.Mock;

// Mock successful git command
mockExec.mockImplementation((cmd, callback) => {
  callback(null, { stdout: 'success output', stderr: '' });
});

// Mock git command error
mockExec.mockImplementation((cmd, callback) => {
  callback(new Error('git error'), { stdout: '', stderr: 'error message' });
});
```

---

## Testing Patterns by Component

### Testing Git Operations (git-helpers.ts)

**Pattern**: Mock exec, verify commands, return expected output

```typescript
describe('GitHelpers', () => {
  describe('moveWorktree', () => {
    it('should move worktree successfully', async () => {
      // Arrange
      mockExec.mockImplementation((cmd, callback) => {
        expect(cmd).toContain('git worktree move');
        callback(null, { stdout: '', stderr: '' });
      });

      // Act
      const result = await GitHelpers.moveWorktree('/old/path', '/new/path');

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when move fails', async () => {
      // Arrange
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('failed'), {
          stdout: '',
          stderr: 'destination already exists'
        });
      });

      // Act
      const result = await GitHelpers.moveWorktree('/old/path', '/new/path');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Testing File Operations (file-copier.ts)

**Pattern**: Mock fs methods, verify file reads/writes

```typescript
describe('FileCopier', () => {
  it('should copy files matching patterns', async () => {
    // Arrange
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
    (fs.copyFileSync as jest.Mock).mockImplementation(() => {});

    // Act
    const result = await FileCopier.copyFiles(
      '/source',
      '/dest',
      ['.env'],
      []
    );

    // Assert
    expect(result.copied).toContain('.env');
    expect(fs.copyFileSync).toHaveBeenCalled();
  });
});
```

### Testing Configuration (config-reader.ts)

**Pattern**: Mock file reads, test YAML parsing

```typescript
describe('ConfigReader', () => {
  it('should parse valid YAML frontmatter', () => {
    // Arrange
    const content = `---
worktree_base_path: ~/worktrees
branch_prefix: feature/
---
# Config file content`;

    (fs.readFileSync as jest.Mock).mockReturnValue(content);

    // Act
    const config = ConfigReader.loadConfig();

    // Assert
    expect(config.worktree_base_path).toBe('~/worktrees');
    expect(config.branch_prefix).toBe('feature/');
  });
});
```

### Testing Tools (worktree-*.ts)

**Pattern**: Mock GitHelpers calls, verify tool logic

```typescript
import { WorktreeMoveTool } from '../src/tools/worktree-move';
import * as GitHelpers from '../src/utils/git-helpers';

jest.mock('../src/utils/git-helpers');

describe('WorktreeMoveTool', () => {
  it('should call GitHelpers.moveWorktree', async () => {
    // Arrange
    const mockMove = jest.spyOn(GitHelpers.GitHelpers, 'moveWorktree')
      .mockResolvedValue({ success: true });

    // Act
    const result = await WorktreeMoveTool.execute({
      current_path: '/old',
      new_path: '/new',
    });

    // Assert
    expect(mockMove).toHaveBeenCalledWith('/old', '/new', undefined);
    expect(result.success).toBe(true);
  });
});
```

---

## Test Data Fixtures

### Mock Git Worktree List Output

```typescript
const mockWorktreeListOutput = `worktree /path/to/main
HEAD abc123
branch refs/heads/main

worktree /path/to/feature
HEAD def456
branch refs/heads/feature/test
locked reason for lock

worktree /path/to/detached
HEAD ghi789
detached`;
```

### Mock Config File Content

```typescript
const mockConfigContent = `---
worktree_base_path: ~/worktrees
branch_prefix: feature/
copy_files_enabled: true
copy_file_patterns:
  - .env
  - .vscode/**
exclude_file_patterns:
  - node_modules
  - dist
---

Configuration for worktree-manager plugin.`;
```

---

## Testing Edge Cases

### File System Edge Cases
- [ ] Files with special characters in names
- [ ] Very long file paths (>256 chars)
- [ ] Symlinks
- [ ] Files without read permissions
- [ ] Directories without write permissions
- [ ] Disk full scenarios
- [ ] Non-existent parent directories

### Git Edge Cases
- [ ] Detached HEAD state
- [ ] Merge conflicts
- [ ] Untracked files
- [ ] Locked worktrees
- [ ] Corrupted worktree references
- [ ] Missing .git directory
- [ ] Invalid branch names
- [ ] Remote tracking branches

### Configuration Edge Cases
- [ ] Missing config file (use defaults)
- [ ] Malformed YAML
- [ ] Invalid glob patterns
- [ ] Empty arrays
- [ ] Null/undefined values
- [ ] Type mismatches
- [ ] Unknown config keys

### Tool Parameter Edge Cases
- [ ] Missing required parameters
- [ ] Empty strings
- [ ] Paths with spaces
- [ ] Paths with special characters
- [ ] Relative vs absolute paths
- [ ] Tilde expansion (~/)
- [ ] Trailing slashes

---

## Continuous Integration

### GitHub Actions (Future)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd mcp-server && npm ci
      - run: cd mcp-server && npm test
      - run: cd mcp-server && npm run build
```

---

## Test Maintenance

### When Adding New Features

1. **Write tests first** (TDD approach recommended)
2. **Test happy path**: Normal operation with valid inputs
3. **Test error cases**: Invalid inputs, missing dependencies
4. **Test edge cases**: Boundary conditions, unusual states
5. **Update existing tests**: If types change, update expectations
6. **Verify coverage**: Run `npm test -- --coverage`

### When Fixing Bugs

1. **Write failing test**: Reproduce the bug in a test
2. **Fix the bug**: Make the test pass
3. **Add regression test**: Ensure bug doesn't return
4. **Check related tests**: Verify no unintended side effects

### Refactoring

1. **Run tests before**: Ensure all tests pass
2. **Refactor code**: Make changes
3. **Run tests after**: Verify all tests still pass
4. **Update tests if needed**: Only if interface changed

---

## Debugging Tests

### View Detailed Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- -t "test name pattern"
```

### Debug in VS Code

`.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/mcp-server/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--config",
    "${workspaceFolder}/mcp-server/jest.config.js",
    "--runInBand"
  ],
  "console": "integratedTerminal",
  "cwd": "${workspaceFolder}/mcp-server"
}
```

### Common Issues

**Issue**: Mock not working
- **Solution**: Check mock is defined before import
- **Solution**: Use `jest.mock()` at top of file

**Issue**: Async test timing out
- **Solution**: Return promise or use async/await
- **Solution**: Increase timeout: `jest.setTimeout(10000)`

**Issue**: Mock not resetting between tests
- **Solution**: Use `beforeEach(() => jest.clearAllMocks())`

---

## Performance Testing

### Measuring Test Speed

```bash
npm test -- --verbose | grep "Time:"
```

**Target**: All tests should complete in <5 seconds

### Optimizing Slow Tests

1. **Use mocks**: Don't make real file system or git calls
2. **Avoid nested describes**: Flatten test structure
3. **Parallel execution**: Jest runs tests in parallel by default
4. **Clean up properly**: Don't leave side effects between tests

---

## Test Checklist

Before committing code, verify:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Coverage maintained: `npm test -- --coverage`
- [ ] No console warnings or errors
- [ ] Tests are fast (<5 seconds total)
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Edge cases are covered

---

**Last Updated**: 2026-01-08
