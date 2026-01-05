---
description: Create git worktree with auto-setup
argument-hint: "<feature-name> [options]"
allowed-tools:
  - "mcp__worktree__worktree_start"
  - "Read"
---

# Worktree Start Command

Create a new git worktree for parallel feature development with automatic environment setup.

## Usage

```bash
/worktree-manager:start <feature-name> [options]
```

## What It Does

1. Creates a new git worktree from the current branch
2. Creates a new feature branch (feature/<name>)
3. Detects project type (web, iOS, full-stack)
4. Runs automatic setup (npm install, swift build, etc.)
5. Suggests next steps

## Examples

### Basic Usage
```
/worktree-manager:start oauth-flow
```

Creates worktree at `~/worktrees/oauth-flow` with branch `feature/oauth-flow`.

### Custom Base Branch
```
/worktree-manager:start hotfix --base-branch=develop
```

Branches from `develop` instead of `main`.

### Custom Location
```
/worktree-manager:start experiment --worktree-path=/tmp/test-worktree
```

Creates worktree at custom path.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--base-branch` | Branch to branch from | `main` |
| `--worktree-path` | Custom worktree location | `~/worktrees/<feature-name>` |

## Automated Workflows

For automated planning and implementation, use **Chainer** plugin:

```bash
# Install Chainer
git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer

# Full workflow (plan + implement)
/chainer:run plan-and-implement \
  --prompt="Build OAuth authentication" \
  --feature_name="oauth"

# Or create worktree first, then chain
/worktree-manager:start oauth
/chainer:run plan-and-implement \
  --cwd="~/worktrees/oauth" \
  --prompt="Build OAuth" \
  --feature_name="oauth"
```

## Implementation

Read the feature name from the user's input.

Call the MCP tool to create the worktree:

```javascript
const result = await mcp__worktree__worktree_start({
  feature_name: "oauth-flow",  // from user input
  base_branch: "main",          // optional, from --base-branch flag
  worktree_path: undefined      // optional, from --worktree-path flag
});
```

Display the result to the user:

```
✅ Worktree created successfully!
📁 Path: ~/worktrees/oauth-flow
🌿 Branch: feature/oauth-flow

🔗 Chainer detected! For automated development:

  # Full workflow (plan + implement)
  /chainer:run plan-and-implement \
    --cwd="~/worktrees/oauth-flow" \
    --prompt="Your feature idea" \
    --feature_name="oauth-flow"

  # Or just planning
  /chainer:run plan-only --cwd="~/worktrees/oauth-flow" --prompt="Your idea"

  # Or manual development
  cd ~/worktrees/oauth-flow && claude
```

Or if Chainer is not installed:

```
✅ Worktree created successfully!
📁 Path: ~/worktrees/oauth-flow
🌿 Branch: feature/oauth-flow

Next steps:
  cd ~/worktrees/oauth-flow
  claude

💡 For automated workflows, install Chainer:
   git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer

   Then use:
   /chainer:run plan-and-implement --prompt="Your idea" --feature_name="name"
```

## Error Handling

Handle these common errors:

- Not in a git repository
- Worktree path already exists
- Branch already exists
- Setup commands failed

Show clear error messages and suggested fixes.

## Configuration

Users can configure defaults in `~/.claude/worktree-manager.local.md`:

```yaml
---
worktree_base_path: ~/my-worktrees
branch_prefix: feat/
create_learnings_file: true
---
```

See `/worktree-manager:list` to view configuration.
