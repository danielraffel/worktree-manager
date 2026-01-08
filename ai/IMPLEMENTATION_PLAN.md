# Worktree Manager Enhancement Implementation Plan

**Goal**: Bring worktree-manager to feature parity with advanced worktree management capabilities while maintaining single-responsibility design (no remote operations).

**Status**: Planning Complete - Ready for Implementation

---

## Feature Categories

### Category 1: Enhanced File Management ✅ Approved
Copy development environment files when creating worktrees.

**Features**:
- Copy untracked files with configurable patterns
- Default includes: `.env`, `.vscode/**`, `*.local` files
- Default excludes: `node_modules`, `dist`, `.git`, `build`, `coverage`
- Pattern-based selective copying
- Preserve local environment across worktrees

**Implementation**:
- [x] Add file copying logic to `mcp-server/src/utils/file-copier.ts`
- [x] Add config options: `copy_files_enabled`, `copy_file_patterns`, `exclude_file_patterns`
- [x] Integrate into worktree creation workflow in `worktree-start.ts`
- [x] Add tests: `tests/unit/file-copier.test.ts`
- [x] Document in README.md configuration section
- [x] Update index.html features list

### Category 2: Advanced Worktree Operations ✅ Approved
Better worktree lifecycle management.

**Features**:
- Move worktrees to new filesystem locations
- Lock worktrees (prevent accidental removal)
- Unlock worktrees
- Repair broken/damaged worktrees
- Prune orphaned worktree references

**Implementation**:
- [x] Add methods to `mcp-server/src/utils/git-helpers.ts`:
  - [x] `moveWorktree(currentPath, newPath)`
  - [x] `lockWorktree(path, reason?)`
  - [x] `unlockWorktree(path)`
  - [x] `repairWorktree(path)`
  - [x] `pruneWorktrees()`
- [x] Create new commands:
  - [x] `commands/move.md` - Move worktree
  - [x] `commands/lock.md` - Lock worktree
  - [x] `commands/unlock.md` - Unlock worktree
  - [x] `commands/repair.md` - Repair worktree
  - [x] `commands/prune.md` - Prune orphaned worktrees
- [x] Create MCP tools:
  - [x] `mcp-server/src/tools/worktree-move.ts`
  - [x] `mcp-server/src/tools/worktree-lock.ts`
  - [x] `mcp-server/src/tools/worktree-unlock.ts`
  - [x] `mcp-server/src/tools/worktree-repair.ts`
  - [x] `mcp-server/src/tools/worktree-prune.ts`
- [ ] Add tests for each operation
- [ ] Document in README.md
- [ ] Update index.html features list

### Category 3: Branch Management ✅ Approved
More flexible branch operations in worktree context.

**Features**:
- Rename branches in worktrees
- Delete branches (local, optionally remote with confirmation)
- Create worktrees from existing branches (not just new branches)

**Implementation**:
- [x] Add methods to `mcp-server/src/utils/git-helpers.ts`:
  - [x] `renameBranch(worktreePath, oldName, newName)`
  - [x] `deleteBranch(branchName, force?, remote?)`
  - [x] `checkoutExistingBranch(worktreePath, branchName)`
- [x] Update `worktree-start.ts` to support `--existing-branch=<name>` option
- [x] Create new commands:
  - [x] `commands/rename-branch.md`
  - [x] `commands/delete-branch.md`
- [x] Create MCP tools:
  - [x] `mcp-server/src/tools/worktree-rename-branch.ts`
  - [x] `mcp-server/src/tools/worktree-delete-branch.ts`
- [ ] Add tests for branch operations
- [ ] Document in README.md
- [ ] Update index.html features list

---

## Testing Requirements

### Unit Tests (Required)
- [ ] `tests/unit/file-copier.test.ts` - File copying patterns, includes/excludes
- [ ] `tests/unit/git-helpers-extended.test.ts` - New git operations
- [ ] `tests/unit/config-management.test.ts` - New config options validation
- [ ] `tests/unit/worktree-move.test.ts` - Move operation edge cases
- [ ] `tests/unit/worktree-lock.test.ts` - Lock/unlock scenarios
- [ ] `tests/unit/branch-operations.test.ts` - Rename/delete validation

### Integration Tests (Recommended)
- [ ] `tests/integration/file-copying-workflow.test.ts` - End-to-end file copy
- [ ] `tests/integration/worktree-lifecycle.test.ts` - Create → Move → Lock → Unlock → Cleanup
- [ ] `tests/integration/branch-management.test.ts` - Branch operations across worktrees
- [ ] `tests/integration/error-recovery.test.ts` - Partial failures, resilience

### Edge Case Coverage
- [ ] Empty/missing source directories for file copying
- [ ] Invalid patterns in copy configuration
- [ ] Moving worktrees to existing paths (collision)
- [ ] Locking already-locked worktrees
- [ ] Repairing non-existent worktrees
- [ ] Pruning with active worktrees
- [ ] Renaming branches in detached HEAD state
- [ ] Deleting protected branches
- [ ] Cross-platform path handling (Windows/macOS/Linux)

### Test Organization
```
tests/
├── unit/
│   ├── file-copier.test.ts (NEW)
│   ├── git-helpers-extended.test.ts (NEW)
│   ├── config-management.test.ts (NEW)
│   ├── worktree-move.test.ts (NEW)
│   ├── worktree-lock.test.ts (NEW)
│   └── branch-operations.test.ts (NEW)
├── integration/
│   ├── file-copying-workflow.test.ts (NEW)
│   ├── worktree-lifecycle.test.ts (NEW)
│   ├── branch-management.test.ts (NEW)
│   └── error-recovery.test.ts (NEW)
└── ai/
    ├── TESTING_GUIDE.md (NEW)
    ├── EDGE_CASES.md (NEW)
    └── MANUAL_TESTING_CHECKLIST.md (NEW)
```

---

## Configuration Updates

### New Config Options

Add to `mcp-server/src/utils/config-reader.ts`:

```yaml
# File copying when creating worktrees
copy_files_enabled: true
copy_file_patterns: ['.env', '.env.*', '.vscode/**', '*.local']
exclude_file_patterns: ['node_modules', 'dist', 'build', 'coverage', '.git']

# Worktree safety
allow_force_operations: false  # Require explicit --force for dangerous ops
default_lock_reason: "In active development"
```

Configuration table updates needed in README.md:
| Option | Default | Description |
|--------|---------|-------------|
| `copy_files_enabled` | `true` | Auto-copy development environment files to new worktrees |
| `copy_file_patterns` | `['.env', '.vscode/**', '*.local']` | Glob patterns for files to copy |
| `exclude_file_patterns` | `['node_modules', 'dist', '.git']` | Patterns to exclude from copying |
| `allow_force_operations` | `false` | Allow dangerous operations without --force flag |

---

## Documentation Updates

### README.md Updates
- [ ] Add "Enhanced File Management" section
- [ ] Add "Advanced Worktree Operations" section
- [ ] Add "Branch Management" section
- [ ] Update configuration table with new options
- [ ] Update "Available Commands" list
- [ ] Add examples for new features
- [ ] Update feature comparison (if exists)

### index.html Updates
- [ ] Add file copying to capabilities list
- [ ] Add worktree lifecycle features (move, lock, repair, prune)
- [ ] Add branch management features
- [ ] Update configuration examples
- [ ] NO "New Feature" callouts - integrate naturally into existing lists

### CLAUDE.md Updates
- [ ] Document new utilities in architecture section
- [ ] Update command list
- [ ] Add notes about testing new features

---

## Manual Testing Checklist

Create `/Users/danielraffel/Code/worktree-manager/ai/MANUAL_TESTING_CHECKLIST.md` with:

### File Copying Tests
- [ ] Create worktree with .env file in main repo - verify copied
- [ ] Create worktree with .vscode/ folder - verify copied
- [ ] Create worktree with node_modules/ - verify NOT copied
- [ ] Test with custom patterns in config
- [ ] Test with disabled file copying (config: false)
- [ ] Test with malformed glob patterns

### Worktree Move Tests
- [ ] Move worktree to new location - verify git still works
- [ ] Move to existing path - verify error
- [ ] Move locked worktree - verify behavior
- [ ] Move then run status command - verify path updated

### Lock/Unlock Tests
- [ ] Lock worktree - verify prevents cleanup
- [ ] Lock with custom reason - verify stored
- [ ] Unlock and cleanup - verify works
- [ ] List locked worktrees - verify shows lock status

### Repair Tests
- [ ] Corrupt worktree reference manually - verify repair fixes it
- [ ] Repair non-existent worktree - verify error handling
- [ ] Repair after moving parent repo - verify works

### Prune Tests
- [ ] Delete worktree directory manually - verify prune removes reference
- [ ] Prune with active worktrees - verify leaves them alone
- [ ] Prune with no orphans - verify reports clean state

### Branch Management Tests
- [ ] Rename branch in worktree - verify refs updated
- [ ] Delete local branch - verify removed
- [ ] Delete branch with uncommitted changes - verify safeguard
- [ ] Create worktree from existing branch - verify checkout works
- [ ] Rename with invalid characters - verify validation

### Cross-Platform Tests
- [ ] Windows: Test paths with spaces, backslashes
- [ ] macOS: Test with symlinks, case-sensitivity
- [ ] Linux: Test permission models

---

## Implementation Phases

### Phase 1: File Management (Week 1)
1. Create file-copier.ts utility
2. Add config options
3. Integrate into worktree-start.ts
4. Write unit tests
5. Update documentation
6. Manual testing

### Phase 2: Advanced Worktree Operations (Week 2)
1. Implement git-helpers methods (move, lock, unlock, repair, prune)
2. Create 5 new commands
3. Create 5 new MCP tools
4. Write unit + integration tests
5. Update documentation
6. Manual testing

### Phase 3: Branch Management (Week 3)
1. Add branch operation methods to git-helpers
2. Update worktree-start for existing branches
3. Create rename/delete commands and tools
4. Write unit tests
5. Update documentation
6. Manual testing

### Phase 4: Integration & Polish (Week 4)
1. Full integration testing
2. Cross-platform testing
3. Performance testing
4. Documentation review
5. Create ai/TESTING_GUIDE.md
6. Create ai/EDGE_CASES.md
7. Final manual testing checklist

---

## Success Criteria

- [ ] All new features implemented and working
- [ ] Test coverage maintained at 99%+
- [ ] All 48+ existing tests still pass
- [ ] New tests added for all features
- [ ] README.md updated with all new features
- [ ] index.html updated with all new features
- [ ] Configuration options documented
- [ ] Manual testing checklist completed
- [ ] No regressions in existing functionality
- [ ] Build succeeds: `npm run build`
- [ ] Bundle size reasonable (< 250KB)

---

## Risk Mitigation

**Risks**:
1. Breaking existing functionality
2. Cross-platform compatibility issues
3. File pattern edge cases
4. Git version differences

**Mitigations**:
1. Comprehensive test coverage before any implementation
2. Test on multiple platforms (macOS, Linux, Windows)
3. Extensive glob pattern testing with edge cases
4. Document minimum Git version requirements (2.40+)
5. Graceful degradation for unsupported Git features

---

## Notes

- **No remote operations** (fetch, pull, push) - maintaining single-responsibility design
- **Focus on worktree-specific features** that can't be easily done with basic git commands
- File copying provides real automation value (manual copying is tedious)
- Advanced operations (move, lock, repair) are worktree-specific and useful
- Branch management in worktree context is a convenience that enhances workflow

---

**Last Updated**: 2026-01-07
**Status**: Ready for Implementation
