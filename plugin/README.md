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
/worktree-manager:status ~/snapguide-worktrees/feature-name
```

### Cleanup

```
/worktree-manager:cleanup ~/snapguide-worktrees/old-feature
/worktree-manager:cleanup ~/snapguide-worktrees/done-feature --merge
```

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
