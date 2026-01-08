# Testing Worktree Manager

> **Note**: This plugin provides git worktree operations only.
> For automated workflows (planning + implementation), see [Chainer plugin](https://github.com/danielraffel/Chainer).

This guide covers testing the core git worktree functionality.

## Prerequisites

1. **Build the MCP server** (required before testing):
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

2. **Verify tests pass**:
   ```bash
   cd mcp-server
   npm test
   ```
   All tests should pass (99% coverage).

## Installing the Plugin

The plugin is installed via the `.claude-plugin/plugin.json` manifest, which defines the MCP server connection.

**Launch Claude Code with the plugin**:
```bash
claude-code --plugin-dir /Users/danielraffel/Code/worktree-manager/plugin
```

Or add to your `~/.claude/settings.json`:
```json
{
  "pluginDirs": [
    "/Users/danielraffel/Code/worktree-manager/plugin"
  ]
}
```

## Basic Functionality Tests

### 1. Test Worktree Creation

**Purpose**: Verify basic worktree creation with auto-setup.

```bash
# In Claude Code:
/worktree-manager:start add-dark-mode
```

**Expected behavior**:
- Creates new worktree at configured base path (default: `~/worktrees/add-dark-mode`)
- Creates branch `feature/add-dark-mode` (or custom prefix from config)
- Detects project type and runs appropriate setup
- Suggests next steps (including Chainer if installed)

**Verify**:
```bash
/worktree-manager:list
```
Should show the new worktree with status.

## Auto-Setup Detection Tests

### 2. Test Web Project Auto-Setup

**Setup**: Navigate to a project with `web/package.json`.

```bash
/worktree-manager:start test-feature
```

**Expected behavior**:
- Detects web project type
- Automatically runs `npm install` in `web/` directory
- Prints success message

**Verify**: Check that `web/node_modules/` exists in new worktree.

### 3. Test iOS Project Auto-Setup

**Setup**: Navigate to a project with `Package.swift`.

```bash
/worktree-manager:start ios-feature
```

**Expected behavior**:
- Detects iOS project type
- Automatically runs `swift build`
- Prints build output

## Status and Cleanup Tests

### 4. Test Status Command

```bash
/worktree-manager:status <worktree-path>
```

**Expected behavior**:
- Shows current branch
- Shows git status (uncommitted changes, untracked files)
- Shows remote tracking status (ahead/behind)

### 5. Test List Command

```bash
/worktree-manager:list
```

**Expected behavior**:
- Lists all active worktrees
- Shows path and branch for each
- Optionally shows status with `--include-status` flag

### 6. Test Cleanup Without Merge

**Setup**: Create a test worktree, make some commits.

```bash
/worktree-manager:cleanup <worktree-path>
```

**Expected behavior**:
- Removes worktree directory
- Deletes associated feature branch
- Does NOT merge to main
- Prevents data loss (checks for uncommitted changes)

### 7. Test Cleanup With Merge

**Setup**: Create a worktree, commit changes you want to keep.

```bash
/worktree-manager:cleanup <worktree-path> --auto-merge
```

**Expected behavior**:
- Merges feature branch into target branch (default: main)
- Removes worktree directory
- Deletes the feature branch
- Prints merge result

## Configuration Tests

### 8. Test Global Configuration

**Setup**: Create `~/.claude/worktree-manager.local.md` with:

```yaml
---
worktree_base_path: ~/my-worktrees
branch_prefix: wip/
create_learnings_file: true
---
```

**Test**:
```bash
/worktree-manager:start custom-test
```

**Expected behavior**:
- Creates worktree at `~/my-worktrees/custom-test/`
- Creates branch `wip/custom-test`
- Creates `LEARNINGS.md` file for capturing insights

### 9. Test Project-Specific Config

**Setup**: Create `.claude/worktree-manager.local.md` in project root:

```yaml
---
branch_prefix: feat/
worktree_base_path: ~/project-worktrees
---
```

**Test**:
```bash
/worktree-manager:start project-feature
```

**Expected behavior**:
- Project config overrides global config
- Creates worktree at `~/project-worktrees/project-feature/`
- Creates branch `feat/project-feature`

## Edge Cases and Error Handling

### 10. Test No Git Repo Error

**Setup**: Navigate to a directory without git.

```bash
/worktree-manager:start test
```

**Expected behavior**:
- Error message: "Current directory is not a git repository"
- Provides helpful next steps
- Does not crash

### 11. Test Duplicate Branch Name

**Setup**: Create a branch, then try to create worktree with same name.

```bash
/worktree-manager:start existing-branch
```

**Expected behavior**:
- Error message about branch or worktree already existing
- Suggests using different name or cleaning up

### 12. Test Reusing Clean Worktree

**Setup**: Create a worktree, commit all changes (clean state), then try to create same worktree.

```bash
/worktree-manager:start existing-feature
```

**Expected behavior**:
- Detects existing clean worktree
- Reuses it instead of failing
- Skips setup (already configured)
- Message: "♻️ Reusing existing clean worktree"

## Manual Verification Checklist

After automated tests, manually verify:

- [ ] Worktrees are created in correct location
- [ ] Branches follow naming convention from config
- [ ] Auto-setup runs for detected project types (web, iOS)
- [ ] Cleanup properly removes worktrees and branches
- [ ] Merge option preserves work in target branch
- [ ] Configuration from both global and project files is respected
- [ ] Status commands show accurate information
- [ ] Error messages are clear and actionable
- [ ] Chainer suggestions appear when appropriate

## Integration with Chainer

### 13. Test Chainer Integration

**Requirements**: Chainer plugin installed.

The `worktree-plan-implement` chain is built into Chainer for full automation:

```bash
# Full workflow (plan + implement)
/chainer:run worktree-plan-implement \
  --prompt "implement search feature" \
  --feature_name "search"
```

**Expected behavior**:
- Creates worktree via worktree-manager
- Runs feature-dev for planning
- Runs ralph-wiggum for implementation
- Entire process automated in isolated workspace

See [Chainer documentation](https://github.com/danielraffel/Chainer) for more details.

## Performance Tests

### 14. Test Large Repository

**Setup**: Use a repository with many worktrees (5+).

```bash
/worktree-manager:list --include-status
```

**Expected behavior**:
- Commands complete in reasonable time (<5 seconds)
- Output is formatted clearly
- No performance degradation

## Reporting Issues

If tests fail, collect:
1. Output from `npm test` in mcp-server/
2. Claude Code logs
3. MCP server logs (check stderr output)
4. Configuration files (`~/.claude/worktree-manager.local.md`)
5. Git version (`git --version`)
6. Node version (`node --version`)

Report issues at: https://github.com/danielraffel/worktree-manager/issues
