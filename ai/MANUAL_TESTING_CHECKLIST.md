# Manual Testing Checklist

This checklist covers manual testing scenarios for all worktree-manager features.

## Test Environment Setup

- [ ] Have a git repository with at least one commit
- [ ] Have main branch checked out
- [ ] Have clean working directory
- [ ] Claude Code installed and running
- [ ] worktree-manager plugin installed

---

## Phase 1: File Copying Tests

### Basic File Copying
- [ ] Create worktree with .env file in main repo - verify copied
- [ ] Create worktree with .env.local file - verify copied
- [ ] Create worktree with .vscode/ folder - verify entire folder copied
- [ ] Create worktree with nested .vscode/settings.json - verify hierarchy maintained
- [ ] Verify node_modules/ is NOT copied (default exclude)
- [ ] Verify .git/ is NOT copied (default exclude)

### Custom Patterns
- [ ] Set custom copy_file_patterns in config - verify honored
- [ ] Set custom exclude_file_patterns in config - verify honored
- [ ] Test with pattern: `**/*.config` - verify all .config files copied
- [ ] Test with empty patterns array - verify no files copied

### Edge Cases
- [ ] Disable file copying (copy_files_enabled: false) - verify no files copied
- [ ] Create worktree when destination already has .env - verify skipped
- [ ] Create worktree with file permissions 755 - verify permissions preserved
- [ ] Test with malformed glob pattern - verify graceful error

---

## Phase 2: Worktree Operations Tests

### Move Operation
- [ ] Move worktree to new location - verify git still works
- [ ] Move worktree - cd into new location and run git status
- [ ] Move to existing path - verify error and helpful message
- [ ] Move non-existent worktree - verify error
- [ ] Move then run /worktree-manager:list - verify path updated

### Lock Operation
- [ ] Lock worktree - verify lock successful
- [ ] Lock with custom reason - verify reason stored
- [ ] Try to cleanup locked worktree - verify prevents cleanup
- [ ] Lock already-locked worktree - verify idempotent behavior
- [ ] List worktrees - verify locked status shows

### Unlock Operation
- [ ] Unlock locked worktree - verify unlock successful
- [ ] Unlock and then cleanup - verify cleanup works
- [ ] Unlock non-locked worktree - verify graceful handling
- [ ] Unlock non-existent worktree - verify error

### Repair Operation
- [ ] Manually move worktree directory - verify repair fixes it
- [ ] Delete .git file in worktree - verify repair recreates it
- [ ] Run repair on working worktree - verify no harm done
- [ ] Repair non-existent worktree - verify error message

### Prune Operation
- [ ] Create worktree, manually rm -rf directory, run prune - verify cleans up
- [ ] Prune with no orphans - verify reports clean state
- [ ] Prune with active worktrees - verify leaves them alone
- [ ] Create multiple orphans - verify prunes all
- [ ] List worktrees before/after prune - verify orphans removed from list

---

## Phase 3: Branch Management Tests

### Create from Existing Branch
- [ ] Create branch manually, then create worktree with existing_branch - verify checkout
- [ ] Try to create from non-existent branch - verify error
- [ ] Create from remote branch - verify works
- [ ] Verify setup commands still run with existing branch

### Rename Branch
- [ ] Rename branch in worktree - verify refs updated
- [ ] Rename to existing branch name - verify error
- [ ] Rename non-existent branch - verify error
- [ ] Rename branch then check git log - verify history intact
- [ ] Rename with invalid characters - verify validation

### Delete Branch
- [ ] Delete merged branch - verify removed
- [ ] Delete unmerged branch without --force - verify error
- [ ] Delete unmerged branch with --force - verify removed
- [ ] Delete with uncommitted changes - verify safeguard
- [ ] Delete current branch - verify error (can't delete checked out branch)
- [ ] Delete with --delete-remote - verify both local and remote deleted
- [ ] Delete remote only (local already deleted) - verify handles gracefully

---

## Integration Tests

### Full Worktree Lifecycle
- [ ] Start: Create worktree
- [ ] Verify: Check status shows clean
- [ ] Lock: Lock the worktree
- [ ] Move: Move to new location
- [ ] Unlock: Unlock the worktree
- [ ] Cleanup: Remove worktree
- [ ] Prune: Verify no orphans

### Multi-Worktree Workflow
- [ ] Create 3 worktrees simultaneously
- [ ] List all - verify all 3 show
- [ ] Lock 2 of them
- [ ] List - verify lock status for each
- [ ] Cleanup all 3 - verify locked ones refuse
- [ ] Unlock and cleanup locked ones

### Branch Workflow
- [ ] Create worktree with new branch
- [ ] Make commits in worktree
- [ ] Rename the branch
- [ ] Merge to main (manually or with cleanup --merge)
- [ ] Delete the branch
- [ ] Cleanup the worktree

---

## Cross-Platform Tests

### macOS Specific
- [ ] Test with symlinks in .vscode/ - verify handled correctly
- [ ] Test with paths containing spaces
- [ ] Test with case-sensitive filenames

### Windows (if available)
- [ ] Test with backslash paths
- [ ] Test with Windows line endings
- [ ] Test with restricted filenames (CON, PRN, etc.)

### Linux (if available)
- [ ] Test with special permissions (executable scripts)
- [ ] Test with symlinks
- [ ] Test in directory with limited permissions

---

## Error Recovery Tests

### Partial Failures
- [ ] Copy files but one fails (permissions) - verify continues with others
- [ ] Network failure during remote delete - verify local still deleted
- [ ] Disk full during file copy - verify error reported

### Concurrent Operations
- [ ] Create two worktrees with same name - verify second fails
- [ ] Move worktree while git operation running in it - verify behavior
- [ ] Delete branch while worktree using it exists - verify error

---

## Configuration Tests

### Config File Locations
- [ ] Set config in ~/.claude/worktree-manager.local.md - verify used
- [ ] Set config in .claude/worktree-manager.local.md - verify overrides global
- [ ] Test with no config file - verify defaults work
- [ ] Test with malformed YAML - verify graceful fallback

### Config Options
- [ ] Set custom worktree_base_path - verify honored
- [ ] Set custom branch_prefix - verify used
- [ ] Enable create_learnings_file - verify LEARNINGS.md created
- [ ] Disable auto_init_submodules - verify submodules not initialized

---

## Performance Tests

### Large Repository
- [ ] Test with repository containing 10,000+ files
- [ ] Test file copying with 1000+ files to copy
- [ ] Test with 50+ existing worktrees

### Large Files
- [ ] Copy .env file with 10MB of content
- [ ] Copy binary files (.vscode/extensions with large files)

---

## Security Tests

### Path Traversal
- [ ] Try to copy files with ../ in pattern - verify sanitized
- [ ] Try to move worktree outside allowed paths - verify safe
- [ ] Test with path injection attempts

### Permission Checks
- [ ] Lock worktree owned by different user - verify permissions checked
- [ ] Copy file with no read permissions - verify error handled
- [ ] Create worktree in read-only directory - verify error

---

## Edge Cases

### Empty/Minimal Repos
- [ ] Repository with only initial commit
- [ ] Repository with no commits (should fail gracefully)
- [ ] Repository with detached HEAD

### Special Characters
- [ ] Worktree path with spaces
- [ ] Branch name with slashes (feature/sub/name)
- [ ] Feature name with special chars (feature-#123)

### Unusual States
- [ ] Worktree with merge conflict
- [ ] Worktree with stashed changes
- [ ] Worktree in rebase state

---

## Success Criteria

- [ ] All basic operations work as documented
- [ ] Error messages are clear and actionable
- [ ] No data loss in any scenario
- [ ] Locked worktrees cannot be deleted
- [ ] All file patterns work correctly
- [ ] Branch safety checks work (prevent unmerged deletion)
- [ ] Git references remain consistent after all operations

---

**Last Updated**: 2026-01-08
