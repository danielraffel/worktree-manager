# Edge Cases Documentation

This document catalogs edge cases, unusual scenarios, and boundary conditions for worktree-manager features.

---

## File Copying Edge Cases

### Pattern Matching

**Empty Pattern Arrays**
- **Scenario**: User sets `copy_file_patterns: []`
- **Expected**: No files copied (intentional)
- **Handling**: Return empty `copied` array, no errors

**Invalid Glob Patterns**
- **Scenario**: Pattern contains invalid regex characters
- **Example**: `copy_file_patterns: ['[invalid'`
- **Expected**: Validation error or skip pattern
- **Handling**: FileCopier.validatePatterns() should catch

**Overlapping Patterns**
- **Scenario**: `['.env*', '.env.local']` - second is redundant
- **Expected**: File copied once, not duplicated
- **Handling**: Track copied files, skip if already copied

**Negation Patterns**
- **Scenario**: User tries `!node_modules` (negative pattern)
- **Expected**: Not supported by current implementation
- **Handling**: Document that negation should use `exclude_file_patterns`

### File System States

**Source File Missing**
- **Scenario**: Pattern matches `.env` but file doesn't exist in source
- **Expected**: Skip silently (it's optional)
- **Handling**: Check `fs.existsSync()` before copy attempt

**Destination File Already Exists**
- **Scenario**: Destination worktree already has `.env` file
- **Expected**: Skip copying, don't overwrite
- **Handling**: Check destination existence, add to `skipped` array

**Permission Denied (Read)**
- **Scenario**: Source file exists but not readable
- **Example**: `.env` with mode 000
- **Expected**: Add to `errors` array, continue with other files
- **Handling**: Catch fs error, add to errors, don't throw

**Permission Denied (Write)**
- **Scenario**: Destination directory not writable
- **Expected**: Add to `errors` array, continue if possible
- **Handling**: Catch fs error, log warning

**Symlinks**
- **Scenario**: `.vscode/settings.json` is symlink to shared config
- **Expected**: Copy symlink or target file?
- **Current**: Likely copies target (fs.copyFileSync follows symlinks)
- **Consider**: Document behavior, optionally preserve symlinks

**Very Large Files**
- **Scenario**: `.env` file is 100MB (unusual but possible)
- **Expected**: Copy succeeds but may be slow
- **Handling**: Consider size limit or warn user

**Binary Files**
- **Scenario**: `.vscode/extensions/*.vsix` (binary)
- **Expected**: Copy as-is (fs.copyFileSync handles binary)
- **Handling**: No special treatment needed

**Special Characters in Filenames**
- **Scenario**: File named `.env (backup)` with spaces/parens
- **Expected**: Copy succeeds
- **Handling**: Ensure proper path escaping in glob matching

**Nested Directories**
- **Scenario**: `.vscode/foo/bar/deep.json`
- **Expected**: Create full directory hierarchy in destination
- **Handling**: `fs.mkdirSync(path, { recursive: true })`

### Cross-Platform Issues

**Path Separators**
- **Scenario**: Windows uses `\`, Unix uses `/`
- **Expected**: Pattern `.vscode/**` works on both
- **Handling**: Use `path.join()`, normalize patterns

**Case Sensitivity**
- **Scenario**: macOS case-insensitive, Linux case-sensitive
- **Expected**: `.ENV` and `.env` treated differently on Linux
- **Handling**: Document case-sensitive matching

**Reserved Filenames (Windows)**
- **Scenario**: Files named `CON`, `PRN`, `AUX`, `NUL`
- **Expected**: Skip on Windows, error
- **Handling**: Detect and warn user

**Line Endings**
- **Scenario**: `.env` has CRLF on Windows, LF on Unix
- **Expected**: Copy as-is (preserve line endings)
- **Handling**: Binary copy preserves exact bytes

---

## Worktree Operations Edge Cases

### Move Operation

**Destination Already Exists**
- **Scenario**: `git worktree move /old /new` but `/new` exists
- **Expected**: Git error "destination already exists"
- **Handling**: Catch error, return helpful message
- **Test**: `moveWorktree('/old', '/existing')`

**Moving to Parent Directory**
- **Scenario**: Move worktree to parent of current location
- **Example**: `/foo/bar/baz` → `/foo/bar`
- **Expected**: Works if path is valid
- **Handling**: Git handles, no special treatment

**Moving Across Filesystems**
- **Scenario**: Move from `/home` to `/mnt/external`
- **Expected**: May fail on some systems
- **Git Version**: Git 2.40+ supports this
- **Handling**: Let git fail naturally, return error

**Relative Paths**
- **Scenario**: `moveWorktree('./worktree', '../new-location')`
- **Expected**: Should work if resolved correctly
- **Handling**: Git resolves relative to cwd

**Path with Spaces**
- **Scenario**: Move to `/home/user/My Projects/feature`
- **Expected**: Works with proper quoting
- **Handling**: Ensure exec command properly escapes/quotes paths

**Symlink Destination**
- **Scenario**: Move to path that's a symlink
- **Expected**: Git follows symlink
- **Handling**: No special treatment

### Lock Operation

**Already Locked**
- **Scenario**: Lock a worktree that's already locked
- **Expected**: Git reports already locked (idempotent)
- **Handling**: Return success, update reason if provided

**Lock Reason with Special Characters**
- **Scenario**: `reason: "Working on feature #123 (urgent!)"`
- **Expected**: Preserve exact text
- **Handling**: Proper shell escaping in git command

**Lock Main Worktree**
- **Scenario**: Lock the main repository worktree
- **Expected**: Git allows this
- **Handling**: No special restriction

**Empty Reason String**
- **Scenario**: `lockWorktree(path, "")`
- **Expected**: Lock without reason
- **Handling**: Don't pass --reason flag if empty

**Very Long Reason**
- **Scenario**: Reason is 1000+ characters
- **Expected**: May hit git limitations
- **Handling**: Consider truncating or warning

### Unlock Operation

**Not Locked**
- **Scenario**: Unlock a worktree that isn't locked
- **Expected**: Git returns error "not locked"
- **Handling**: Return success anyway (already in desired state)

**Unlock Non-Existent Worktree**
- **Scenario**: Path doesn't exist in worktree list
- **Expected**: Git error
- **Handling**: Return error with helpful message

### Repair Operation

**Worktree Never Existed**
- **Scenario**: Try to repair path that was never a worktree
- **Expected**: Git error
- **Handling**: Return error message

**Worktree Was Moved Manually**
- **Scenario**: User moved worktree with `mv` instead of git
- **Expected**: Repair should fix administrative files
- **Handling**: Let git repair handle it

**Parent Repo Moved**
- **Scenario**: Main repo moved, worktrees now have broken references
- **Expected**: Repair from worktree directory should fix
- **Handling**: Git repair updates relative paths

**Corrupted .git File**
- **Scenario**: Worktree's `.git` file is corrupted or deleted
- **Expected**: Repair recreates it
- **Handling**: Standard repair operation

**Multiple Worktrees Need Repair**
- **Scenario**: Several worktrees broken at once
- **Expected**: Run repair on each individually
- **Handling**: No bulk repair command (design choice)

### Prune Operation

**No Orphaned Worktrees**
- **Scenario**: All worktrees valid, nothing to prune
- **Expected**: Git returns empty output
- **Handling**: Return `pruned: []`

**All Worktrees Orphaned**
- **Scenario**: User manually deleted all worktree directories
- **Expected**: Prune removes all references
- **Handling**: Parse git output, return all pruned paths

**Prune with Locked Worktrees**
- **Scenario**: Orphaned worktree was locked
- **Expected**: Git prunes anyway (directory doesn't exist)
- **Handling**: No special treatment

**Concurrent Prune**
- **Scenario**: Two processes prune simultaneously
- **Expected**: Both succeed (idempotent)
- **Handling**: Git handles locking

---

## Branch Management Edge Cases

### Rename Branch

**Branch Doesn't Exist**
- **Scenario**: Rename `feature/nonexistent` to `feature/new`
- **Expected**: Git error "branch not found"
- **Handling**: Return error with branch name

**New Name Already Exists**
- **Scenario**: Rename to branch name that exists
- **Expected**: Git error "already exists"
- **Handling**: Return error, suggest different name

**Renaming Main Branch**
- **Scenario**: Rename `main` to `primary`
- **Expected**: Git allows (but may affect remote tracking)
- **Handling**: No special restriction, let git handle

**Invalid Branch Characters**
- **Scenario**: New name contains spaces or special chars
- **Example**: `feature/my feature` (space)
- **Expected**: Git validation error
- **Handling**: Git rejects, return error

**Branch Name Starting with -**
- **Scenario**: New name is `-test`
- **Expected**: Git interprets as flag
- **Handling**: Git should reject, but worth testing

**Slashes in Branch Name**
- **Scenario**: Rename to `feature/sub/feature/name`
- **Expected**: Git allows (creates namespace hierarchy)
- **Handling**: No restriction

**Detached HEAD State**
- **Scenario**: Worktree in detached HEAD, try to rename
- **Expected**: Git error "not on any branch"
- **Handling**: Return error, suggest checking out branch first

**Remote Tracking Branch**
- **Scenario**: Rename branch that tracks remote
- **Expected**: Local renamed, remote tracking broken
- **Handling**: Git renames local only, document behavior

### Delete Branch

**Unmerged Branch**
- **Scenario**: Delete branch with unmerged commits
- **Expected**: Git refuses with `-d`, requires `-D` (force)
- **Handling**: Try `-d`, catch error, return error unless force=true

**Currently Checked Out**
- **Scenario**: Delete branch you're currently on
- **Expected**: Git error "cannot delete checked out branch"
- **Handling**: Return error, suggest switching branches

**Branch Has Worktree**
- **Scenario**: Delete branch while worktree uses it
- **Expected**: Git may refuse (depends on version)
- **Handling**: Return error, suggest cleanup first

**Delete Main Branch**
- **Scenario**: User tries to delete `main` or `master`
- **Expected**: Git allows if not checked out
- **Handling**: Consider warning user (optional safety check)

**Remote Doesn't Exist**
- **Scenario**: `delete_remote: true` but branch not on remote
- **Expected**: Git push error
- **Handling**: Return warning, still report local delete success

**Remote Authentication Failure**
- **Scenario**: Push fails due to auth/permissions
- **Expected**: Error from git push
- **Handling**: Return warning in result.warnings

**Force Delete Main Branch**
- **Scenario**: `force: true` on `main` branch
- **Expected**: Git allows (dangerous!)
- **Handling**: Consider extra confirmation or block

**Delete Nonexistent Branch**
- **Scenario**: Branch already deleted or never existed
- **Expected**: Git error
- **Handling**: Return error

**Remote Name Invalid**
- **Scenario**: `remote_name: 'nonexistent-remote'`
- **Expected**: Git error "remote not found"
- **Handling**: Return error in warnings array

### Create from Existing Branch

**Branch Doesn't Exist**
- **Scenario**: `existing_branch: 'feature/nonexistent'`
- **Expected**: Git error "reference not found"
- **Handling**: Return error, suggest listing branches

**Branch Already Checked Out**
- **Scenario**: Try to create worktree for branch already in use
- **Expected**: Git error "already checked out"
- **Handling**: Return error, show where it's checked out

**Detached HEAD Branch Reference**
- **Scenario**: `existing_branch: 'HEAD~3'` or commit SHA
- **Expected**: Git allows (creates detached worktree)
- **Handling**: Let git handle, works as expected

**Remote Branch**
- **Scenario**: `existing_branch: 'origin/feature-x'`
- **Expected**: Git creates local tracking branch
- **Handling**: Works automatically

**Ambiguous Branch Name**
- **Scenario**: Branch name exists as local and remote
- **Expected**: Git prefers local
- **Handling**: Document precedence

---

## Repository State Edge Cases

### Empty Repository**
- **Scenario**: Repository with no commits
- **Expected**: Cannot create worktrees (no branches)
- **Handling**: Return error early

### Initial Commit Only**
- **Scenario**: Repository has single commit on main
- **Expected**: Worktrees work normally
- **Handling**: Standard operation

### Detached HEAD in Main**
- **Scenario**: Main repo in detached HEAD state
- **Expected**: Worktrees still work from branches
- **Handling**: No impact

### Bare Repository**
- **Scenario**: Operating on bare repo (no working directory)
- **Expected**: Most operations fail
- **Handling**: Detect and warn user

### Submodules Present**
- **Scenario**: Repository has submodules
- **Expected**: File copier might copy .gitmodules
- **Handling**: Add .gitmodules to default exclude?

### Worktree in Worktree**
- **Scenario**: Try to create worktree inside another worktree
- **Expected**: Git allows (they're independent)
- **Handling**: No restriction

### Merge Conflict State**
- **Scenario**: Main repo has unresolved merge conflicts
- **Expected**: Doesn't affect new worktree creation
- **Handling**: Standard operation

### Rebase in Progress**
- **Scenario**: Main repo in rebase state
- **Expected**: Doesn't block worktree operations
- **Handling**: Standard operation

### Stashed Changes**
- **Scenario**: Main repo has stashed changes
- **Expected**: Doesn't affect worktrees
- **Handling**: Stashes are repo-wide, not worktree-specific

---

## Configuration Edge Cases

### Missing Config File**
- **Scenario**: No `.local.md` file found
- **Expected**: Use all defaults
- **Handling**: DEFAULT_CONFIG fallback

### Malformed YAML**
- **Scenario**: Invalid YAML syntax in frontmatter
- **Expected**: Fall back to defaults, warn user
- **Handling**: Try-catch around yaml.parse()

### Partial Config**
- **Scenario**: Only some fields specified
- **Expected**: Merge with defaults
- **Handling**: Object spread: `{ ...DEFAULT_CONFIG, ...parsed }`

### Type Mismatches**
- **Scenario**: `copy_files_enabled: "yes"` (string not boolean)
- **Expected**: Type coercion or validation error
- **Handling**: Validate types, warn user

### Array vs String**
- **Scenario**: `copy_file_patterns: ".env"` (string not array)
- **Expected**: Convert to array or error
- **Handling**: Validate type, wrap in array if string

### Null Values**
- **Scenario**: `branch_prefix: null`
- **Expected**: Use default value
- **Handling**: Check for null/undefined

### Unknown Keys**
- **Scenario**: Config has `unknown_option: value`
- **Expected**: Ignore silently
- **Handling**: No strict schema validation

### Global vs Project Config**
- **Scenario**: Both `~/.claude/` and `./.claude/` configs exist
- **Expected**: Project config overrides global
- **Handling**: Load global first, then merge project

### Path Expansion**
- **Scenario**: `worktree_base_path: ~/worktrees`
- **Expected**: Expand tilde to home directory
- **Handling**: Use path.resolve() with home expansion

---

## Concurrency Edge Cases

### Multiple Worktrees Created Simultaneously**
- **Scenario**: Two users run start command at same time
- **Expected**: Git locks prevent conflicts
- **Handling**: Git handles automatically

### Move While Git Operation Running**
- **Scenario**: Move worktree while git is running inside it
- **Expected**: May fail or succeed depending on operation
- **Handling**: Git locks should prevent corruption

### Delete Branch with Active Worktree**
- **Scenario**: Delete branch while worktree using it exists
- **Expected**: Git should refuse
- **Handling**: Error returned to user

### Prune While Creating**
- **Scenario**: Prune runs while worktree is being created
- **Expected**: Git locks prevent issues
- **Handling**: Git handles atomicity

---

## Performance Edge Cases

### Large Repository (10,000+ files)**
- **Scenario**: Repo with many files
- **Expected**: File copying may be slow
- **Handling**: Consider progress reporting or async

### Many Worktrees (50+)**
- **Scenario**: User has many worktrees
- **Expected**: List command may be slow
- **Handling**: Git handles, should still be fast

### Deep Directory Nesting**
- **Scenario**: `.vscode/foo/bar/baz/deep/file.json`
- **Expected**: Copy works but needs many mkdirs
- **Handling**: `recursive: true` handles it

### Very Long Paths (>256 characters)**
- **Scenario**: Path exceeds OS limit
- **Expected**: May fail on Windows
- **Handling**: Return fs error

---

## Security Edge Cases

### Path Traversal**
- **Scenario**: User tries `../../etc/passwd` in patterns
- **Expected**: Blocked or sanitized
- **Handling**: Validate paths stay within repository

### Symlink to System Files**
- **Scenario**: `.vscode/settings` is symlink to `/etc/hosts`
- **Expected**: Should not copy sensitive files
- **Handling**: Consider resolving symlinks and validating

### Permission Escalation**
- **Scenario**: Copying files owned by different user
- **Expected**: Preserve ownership or fail
- **Handling**: Copy with current user permissions

### Malicious Glob Patterns**
- **Scenario**: Pattern designed to cause ReDoS
- **Expected**: Validation or timeout
- **Handling**: micromatch should be safe

---

## Success Criteria

Edge cases are properly handled when:

1. **No Data Loss**: Failed operations don't corrupt or lose data
2. **Clear Errors**: User gets helpful error messages
3. **Graceful Degradation**: Partial failures don't break everything
4. **Idempotency**: Running same operation twice is safe
5. **Documentation**: Behavior is documented for unusual cases

---

**Last Updated**: 2026-01-08
