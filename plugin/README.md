# Worktree Manager - Claude Code Plugin

**User-facing plugin for effortless git worktrees with automated feature development**

This is the **frontend layer** of the Worktree Manager system. It provides user-friendly slash commands that invoke the MCP server for git operations.

## What This Provides

### Commands

- `/worktree-manager:start` - Create worktree with workflows
- `/worktree-manager:list` - List all worktrees
- `/worktree-manager:status` - Check worktree status
- `/worktree-manager:cleanup` - Merge and remove worktrees

## Installation

**Prerequisites**:
1. Install the MCP server (see `../claude-plugin/`)
2. Build the MCP server (`npm install && npm run build`)

**Install plugin**:
```bash
# Symlink to Claude plugins directory
ln -s /path/to/worktree-manager-plugin ~/.config/claude/plugins/worktree-manager

# Restart Claude Code
```

**Verify installation**:
```bash
# In Claude Code
/help

# Should show worktree-manager commands
```

## Usage

### Quick Start

**Create a simple worktree**:
```
/worktree-manager:start my-feature
```

**Plan a feature with feature-dev**:
```
/worktree-manager:start auth-system plan-only "Design OAuth2 authentication"
```

**Implement from spec with ralph**:
```
/worktree-manager:start build-auth implement-only audit/auth-spec.md --work-on="P0 items"
```

**Full automation (plan + implement)**:
```
/worktree-manager:start comments plan-and-implement "Add comment system" --work-on="P0"
```

### List Worktrees

```
/worktree-manager:list
/worktree-manager:list --status
```

### Check Status

```
/worktree-manager:status ~/worktrees/feature-name
```

### Cleanup

```
/worktree-manager:cleanup ~/worktrees/old-feature
/worktree-manager:cleanup ~/worktrees/done-feature --merge
```

## Configuration

Create a config file to customize behavior. Settings can be global (user-level) or per-project.

**Global config:** `~/.claude/worktree-manager.local.md`
**Project config:** `.claude/worktree-manager.local.md` (overrides global)

### Example Config

```yaml
---
# Where to create worktrees (default: ~/worktrees)
worktree_base_path: ~/my-worktrees

# Branch prefix (default: feature/)
branch_prefix: feature/

# Default workflow: simple | plan-only | implement-only | plan-and-implement
default_workflow: simple

# Auto-commit changes during ralph execution (default: false)
auto_commit: false

# Auto-push to remote after commits (default: false)
auto_push: false

# Create LEARNINGS.md to capture insights (default: false)
create_learnings_file: true

# Directory for spec files (default: audit)
spec_directory: specs

# Max iterations for ralph (default: 50)
default_max_iterations: 100
---

# Project Notes

Add any project-specific context here.
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `worktree_base_path` | `~/worktrees` | Base directory for all worktrees |
| `branch_prefix` | `feature/` | Prefix for new branches |
| `default_workflow` | `simple` | Workflow when not specified |
| `auto_commit` | `false` | Auto-commit during ralph |
| `auto_push` | `false` | Auto-push after commits |
| `create_learnings_file` | `false` | Create LEARNINGS.md in worktree |
| `spec_directory` | `audit` | Where to save spec files |
| `default_max_iterations` | `50` | Max ralph iterations |

## How It Works

```
User types command
    ↓
Claude reads command markdown (commands/*.md)
    ↓
Claude calls MCP tool (mcp__worktree__*)
    ↓
MCP server executes (git operations, auto-setup)
    ↓
Result returned to Claude
    ↓
Claude formats and displays to user
```

## Development

This plugin is a simple wrapper - all logic is in the MCP server. To modify behavior:

1. Update MCP server code (`../claude-plugin/src/`)
2. Rebuild MCP server (`npm run build`)
3. Update command instructions if needed (`commands/*.md`)
4. Restart Claude Code

## License

MIT - Daniel Raffel
