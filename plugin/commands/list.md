---
description: List all active git worktrees with optional status information
argument-hint: "[--status]"
allowed-tools:
  - "mcp__worktree__worktree_list"
---

# Worktree List Command

Display all active git worktrees with optional detailed status.

## Usage

```bash
/worktree-manager:list [--status]
```

## Instructions for Claude

When user invokes this command:

1. **Parse arguments**:
   - Check for `--status` flag
   - Set `include_status: true` if flag present

2. **Call MCP tool**:
   - Use `mcp__worktree__worktree_list`
   - Pass `{ include_status: <true/false> }`

3. **Display results**:
   - Format as a numbered list
   - For each worktree show:
     - Path
     - Branch name
     - Is it the main worktree?
     - If `--status` was requested:
       - Uncommitted changes count
       - Untracked files count
       - Commits ahead/behind remote

4. **Format example**:
   ```
   Active worktrees:

   1. ~/snapguide-worktrees/admin-messaging
      Branch: feature/admin-messaging
      Status: 3 uncommitted, 1 untracked, 2 ahead, 0 behind

   2. ~/snapguide-worktrees/bug-fix
      Branch: feature/bug-fix
      Status: Clean ✅
   ```

5. **If no worktrees**:
   - Inform user no worktrees found besides main
   - Suggest using `/worktree-manager:start` to create one

## Examples

**Simple list**:
```
User: /worktree-manager:list
Claude: [Shows all worktrees with paths and branches]
```

**With status**:
```
User: /worktree-manager:list --status
Claude: [Shows worktrees with detailed git status]
```
