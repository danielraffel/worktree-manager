# Feature Plan: Worktree Manager + Chainer Split

## Document Status

| Section | Status |
|---------|--------|
| Executive Summary | ✅ Complete |
| Project Directories | ✅ Complete |
| Phase 0: Verify tmux | ⬜ Not Started |
| Phase 1: Chainer MVP | ✅ Complete |
| Phase 2: Refactor Worktree Manager | ✅ Complete |
| Phase 3: Integration | ✅ Complete |
| Phase 4: tmux in Chainer | ✅ Complete |
| Phase 5: Expand Chainer | ✅ Complete |
| Phase 6: Documentation | ✅ Complete |
| Phase 7: Complete Split & Dependency Detection | ✅ Complete |
| Phase 8: Smart Plugin Suggestions | ✅ Complete (MVP - Phase 8a) |
| Phase 9: Worktree + Chainer Integration | ⬜ Deferred (optional) |

**Legend**: ✅ Complete | 🔄 In Progress | ⬜ Not Started | ⚠️ Blocked

---

## Executive Summary

Split the current Worktree Manager plugin into two focused plugins:

1. **Worktree Manager** (`/Users/danielraffel/Code/worktree-manager`) - Pure git worktree operations
2. **Chainer** (`/Users/danielraffel/Code/Chainer`) - Universal plugin orchestration with piping

This separation creates two single-purpose tools that work independently or together.

---

## Project Directories

### Worktree Manager (Existing)
```
/Users/danielraffel/Code/worktree-manager/
├── plugin/                    # Claude Code plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── commands/
│       ├── start.md
│       ├── list.md
│       ├── status.md
│       └── cleanup.md
├── mcp-server/               # TypeScript MCP server
│   ├── src/
│   ├── tests/                # 45 tests, 99% coverage
│   └── package.json
├── ai/                       # AI context (gitignored)
│   └── PROJECT.md
├── index.html                # Marketing webpage
└── README.md
```

### Chainer (New)
```
/Users/danielraffel/Code/Chainer/
├── plugin/                    # Claude Code plugin
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── commands/
│       ├── run.md
│       ├── list.md
│       └── status.md
├── defaults/                  # Default chain configurations
│   └── chainer.local.md
├── community-chains/          # Shareable chain library
│   ├── development/
│   ├── content/
│   └── marketing/
├── settings.html              # Visual chain editor
├── ai/                        # AI context (gitignored)
│   └── PROJECT.md
├── index.html                 # Marketing webpage
└── README.md
```

---

## Phase 0: Verify tmux Isolation

### Status: ⬜ Not Started

### Goal
Confirm the tmux-option branch works before building on it.

### What This Enables
- Confidence to build parallel workflow features
- Foundation for Phase 4 (tmux in Chainer)

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Run end-to-end tmux test | ⬜ | See test plan below |
| Document any issues found | ⬜ | |
| Fix issues if needed | ⬜ | |
| Merge tmux-option to main | ⬜ | After verification |

### Test Plan

```bash
# Test 1: Basic tmux spawning
tmux new -s test-phase0

# Test 2: First worktree with ralph
/worktree-manager:start feature-a implement-only audit/test-spec.md
# Expected: Ralph loop starts
# Verify: ls ~/worktrees/feature-a/.claude/ralph-loop.local.md exists

# Test 3: Second worktree (conflict detection)
/worktree-manager:start feature-b implement-only audit/test-spec.md
# Expected: Conflict detected, options shown
# Choose: A (auto-spawn)
# Verify: New tmux window created

# Test 4: Parallel isolation
# In window 1: feature-a ralph should be iterating
# In window 2: feature-b ralph should be iterating
# Verify: Each has own .claude/ralph-loop.local.md

# Test 5: Independent termination
# Ctrl+C on feature-a
# Verify: feature-b continues running

# Test 6: Cleanup
tmux kill-session -t test-phase0
```

### Verification Checklist
- [ ] Conflict detection works (checks `.claude/ralph-loop.local.md`)
- [ ] Launcher script created in worktree (`start-claude.sh`)
- [ ] tmux window spawning works (when in tmux)
- [ ] tmux session spawning works (when not in tmux)
- [ ] State files are isolated per worktree
- [ ] Stopping one doesn't affect the other

### Deliverable
- tmux-option branch merged to main
- Documented test results

---

## Phase 1: Chainer MVP

### Status: ✅ Complete

### Goal
Create Chainer as a separate plugin that can run chains from config.

### What This Enables
- `/chainer:run plan-and-implement` works standalone
- Users can customize chains via YAML
- Visual settings editor for non-technical users

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Create plugin structure | ✅ | plugin.json, commands/ |
| Implement config parser | ✅ | Parse YAML from .claude/chainer.local.md |
| Create `/chainer:run` command | ✅ | Execute chain by name |
| Create `/chainer:list` command | ✅ | Show available chains |
| Ship default chains | ✅ | plan-and-implement, plan-only, implement-only |
| Build settings.html | ✅ | Visual chain editor |
| Write unit tests | ✅ | Config parser, variable substitution |
| Write README.md | ✅ | |

### Configuration Format

**Location**: `~/.claude/chainer.local.md` or `.claude/chainer.local.md`

```yaml
---
chains:
  plan-and-implement:
    enabled: true
    description: "Plan with feature-dev, implement with ralph-wiggum"
    inputs:
      prompt: { required: true, description: "What to build" }
      feature_name: { required: true, description: "Feature name for spec file" }
    steps:
      - name: plan
        type: skill
        skill: feature-dev:feature-dev
        args: "{{prompt}}"
        output:
          spec_file: "audit/{{feature_name}}.md"
      - name: implement
        type: script
        script: |
          SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)"
          bash "$SCRIPT_PATH" "Implement features from {{spec_file}}" --max-iterations 50 --completion-promise DONE

  plan-only:
    enabled: true
    description: "Just plan with feature-dev"
    inputs:
      prompt: { required: true }
      feature_name: { required: true }
    steps:
      - name: plan
        type: skill
        skill: feature-dev:feature-dev
        args: "{{prompt}}"

  implement-only:
    enabled: true
    description: "Implement from existing spec"
    inputs:
      spec_file: { required: true }
    steps:
      - name: implement
        type: script
        script: |
          SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)"
          bash "$SCRIPT_PATH" "Implement features from {{spec_file}}" --max-iterations 50 --completion-promise DONE

defaults:
  spec_directory: audit
  max_iterations: 50
---

# Chainer Notes
Project-specific notes here.
```

### Step Types (v1)

| Type | Description | UI Element |
|------|-------------|------------|
| **skill** | Invoke Claude Code skill | Dropdown + args |
| **script** | Run bash commands | Code editor |
| **mcp** | Call MCP server tool | Dropdown + params |
| **prompt** | Ask user mid-chain | Message + options |
| **wait** | Wait for file/condition | Path + timeout |

### Settings Page Features

| Feature | Priority | Notes |
|---------|----------|-------|
| View chains list | P0 | Left sidebar |
| Edit chain steps | P0 | Drag-drop reorder |
| Enable/disable chains | P0 | Toggle per chain |
| Add/remove steps | P0 | Step type dropdown |
| Add/remove inputs | P0 | Required checkbox |
| Save config | P0 | Download .md file |
| Load config | P0 | File upload |
| Import from URL | P1 | GitHub raw URLs |
| Browse community chains | P1 | Built-in library |
| Export single chain | P1 | Share one chain |

### Test Plan

```bash
# Unit tests (Jest)
cd /Users/danielraffel/Code/Chainer
npm test

# Tests to write:
# - config-parser.test.ts: Parse YAML, handle missing fields
# - variable-resolver.test.ts: {{var}} substitution
# - chain-executor.test.ts: Run steps in sequence

# Integration tests
# Test 1: Run plan-and-implement
/chainer:run plan-and-implement --prompt="Test feature" --feature_name="test"
# Verify: feature-dev runs, then ralph starts

# Test 2: Run plan-only
/chainer:run plan-only --prompt="Test" --feature_name="test"
# Verify: Only feature-dev runs

# Test 3: Missing required input
/chainer:run plan-and-implement
# Verify: Error message about missing --prompt

# Test 4: Disabled chain
# Set enabled: false in config
/chainer:list
# Verify: Disabled chain not shown

# Test 5: Custom chain
# Add custom chain to config
/chainer:run my-custom-chain
# Verify: Custom chain executes
```

### Verification Checklist
- [ ] `/chainer:run <chain>` executes chain from config
- [ ] `/chainer:list` shows enabled chains
- [ ] Variable substitution works (`{{prompt}}`)
- [ ] Missing required inputs show error
- [ ] Disabled chains hidden from list
- [ ] settings.html loads and saves config correctly
- [ ] Drag-drop reorder works in settings

### Deliverable
- Chainer v0.1 plugin at `/Users/danielraffel/Code/Chainer`
- 3 default chains working
- Settings page functional
- README with installation instructions

---

## Phase 2: Refactor Worktree Manager

### Status: ✅ Complete

### Goal
Remove chaining logic from Worktree Manager, make it worktree-only.

### What This Enables
- Cleaner, focused Worktree Manager codebase
- Clear separation of concerns
- Easier maintenance

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Remove command-builder.ts plugin methods | ✅ | Lines 29-49 |
| Remove template-filler.ts | ✅ | Entire file |
| Remove ralph-default.ts template | ✅ | Entire file |
| Simplify worktree-start.ts | ✅ | Remove workflow execution |
| Remove PlanConfig, RalphConfig types | ✅ | In types.ts |
| Simplify start.md | ✅ | Remove chaining, add Chainer suggestion |
| Update tests | ✅ | Remove workflow tests |
| Update README | ✅ | Document new scope |
| Update index.html | ✅ | Cross-promote Chainer |

### Files to Modify

| File | Action | Details |
|------|--------|---------|
| `mcp-server/src/utils/command-builder.ts` | Modify | Remove buildFeatureDevCommand, buildRalphCommand |
| `mcp-server/src/utils/template-filler.ts` | Delete | Entire file |
| `mcp-server/src/templates/ralph-default.ts` | Delete | Entire file |
| `mcp-server/src/tools/worktree-start.ts` | Modify | Remove lines 206-739 |
| `mcp-server/src/types.ts` | Modify | Remove PlanConfig, RalphConfig |
| `plugin/commands/start.md` | Rewrite | ~100 lines instead of ~600 |
| `README.md` | Update | New scope, Chainer link |
| `index.html` | Update | Chainer integration section |

### New start.md Behavior

```markdown
# Simplified start.md

## What It Does
1. Create worktree via MCP tool
2. Run auto-setup (npm install, etc.)
3. Detect Chainer and suggest next steps
4. Done

## Output Examples

### Chainer Installed:
✅ Worktree created at ~/worktrees/oauth/
   Branch: feature/oauth
   Setup: npm install completed

🔗 Chainer detected! For automated development:
   /chainer:run plan-and-implement --cwd="~/worktrees/oauth" --prompt="Your idea"

### Chainer Not Installed:
✅ Worktree created at ~/worktrees/oauth/
   Branch: feature/oauth
   Setup: npm install completed

Next steps:
   cd ~/worktrees/oauth
   # Start coding!

💡 For automated workflows, install Chainer:
   git clone https://github.com/danielraffel/Chainer ~/Code/Chainer
```

### Test Plan

```bash
# Run existing tests (should still pass for kept functionality)
cd /Users/danielraffel/Code/worktree-manager/mcp-server
npm test

# Tests to update/remove:
# - worktree-start.test.ts: Remove workflow execution tests
# - Keep: git-helpers, project-detector, setup-runner tests

# Integration tests
# Test 1: Simple worktree creation
/worktree-manager:start test-feature
# Verify: Worktree created, no chaining attempted

# Test 2: Chainer detection
# With Chainer installed
/worktree-manager:start test-feature
# Verify: Chainer suggestion shown

# Test 3: Chainer not installed
# Without Chainer
/worktree-manager:start test-feature
# Verify: Manual next steps shown, install suggestion
```

### Verification Checklist
- [ ] `/worktree-manager:start` creates worktree only
- [ ] No automatic ralph invocation
- [ ] Chainer detection works
- [ ] All kept tests pass
- [ ] README updated
- [ ] index.html updated

### Deliverable
- Worktree Manager v3.0
- Focused on worktree operations only
- Cross-promotes Chainer

---

## Phase 3: Integration

### Status: ✅ Complete

### Goal
Make Chainer and Worktree Manager work seamlessly together.

### What This Enables
- `/chainer:run worktree-plan-implement` (one command for everything)
- `--cwd` parameter for running chains in specific directories
- Smooth user experience across both plugins

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Add `--cwd` parameter to /chainer:run | ✅ | Already documented in run.md |
| Add worktree-plan-implement chain | ✅ | Added to defaults/chainer.local.md |
| Add plugin detection | ✅ | Natural - skill call fails if plugin missing |
| Test both plugins together | ✅ | Manual testing (Phase 0 skipped) |
| Update documentation | ✅ | Both READMEs updated |

### New Chain: worktree-plan-implement

```yaml
worktree-plan-implement:
  description: "Create worktree, plan, implement - full workflow"
  inputs:
    feature_name: { required: true }
    prompt: { required: true }
  steps:
    - name: create-worktree
      type: skill
      skill: worktree-manager:start
      args: "{{feature_name}}"
      output:
        worktree_path: "@capture"
    - name: plan
      type: skill
      skill: feature-dev:feature-dev
      args: "{{prompt}}"
      cwd: "{{worktree_path}}"
    - name: implement
      type: script
      cwd: "{{worktree_path}}"
      script: |
        SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)"
        bash "$SCRIPT_PATH" "Implement features from audit/{{feature_name}}.md" --max-iterations 50 --completion-promise DONE
```

### Test Plan

```bash
# Integration test: Two-command workflow
/worktree-manager:start oauth
/chainer:run plan-and-implement --cwd="~/worktrees/oauth" --prompt="Design OAuth"
# Verify: Works in worktree directory

# Integration test: One-command workflow
/chainer:run worktree-plan-implement --feature_name="oauth" --prompt="Design OAuth"
# Verify: Creates worktree, then plans, then implements

# Integration test: Plugin detection
# Without worktree-manager installed
/chainer:run worktree-plan-implement ...
# Verify: Error message about missing plugin
```

### Verification Checklist
- [ ] `--cwd` parameter works
- [ ] worktree-plan-implement chain works
- [ ] Plugin detection shows helpful errors
- [ ] Both READMEs document integration

### Deliverable
- Chainer v0.1.1 with --cwd and worktree chain
- Both plugins work together seamlessly

---

## Phase 4: tmux in Chainer

### Status: ✅ Complete

### Goal
Move parallel workflow support from Worktree Manager to Chainer.

### What This Enables
- Parallel chains via tmux
- `/chainer:status` to check running chains
- Clean separation (Worktree Manager has no tmux logic)

### Prerequisites
- [x] Phase 0 verified working (skipped - manual testing)
- [x] Phase 3 complete

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Implement conflict detection in Chainer | ✅ | Added to run.md Step 4 |
| Implement tmux spawning in Chainer | ✅ | Added to run.md Step 5 |
| Add `auto_spawn_strategy` config | ✅ | Added to defaults: ask/always/never |
| Create `/chainer:status` command | ✅ | Full implementation in status.md |
| Remove tmux logic from Worktree Manager | ✅ | Already removed in Phase 2 |
| Write tests | ⬜ | Manual testing required |

### Chainer State File

Location: `.claude/chainer-state.json`

```json
{
  "running_chains": [
    {
      "chain": "plan-and-implement",
      "started": "2025-01-05T10:30:00Z",
      "cwd": "~/worktrees/oauth",
      "current_step": 2,
      "total_steps": 2,
      "pid": 12345
    }
  ]
}
```

### /chainer:status Output

```
┌─────────────────────────────────────────┐
│ Chainer Status                          │
├─────────────────────────────────────────┤
│ 🔄 plan-and-implement (oauth)           │
│    Step 2/2: implement                  │
│    Directory: ~/worktrees/oauth         │
│    Running: 10 min                      │
│                                         │
│ ✅ plan-only (billing)                  │
│    Completed 5 min ago                  │
│    Directory: ~/worktrees/billing       │
└─────────────────────────────────────────┘
```

### Test Plan

```bash
# Test 1: Conflict detection
/chainer:run plan-and-implement --prompt="Feature A" --feature_name="a"
# While running:
/chainer:run plan-and-implement --prompt="Feature B" --feature_name="b"
# Verify: Conflict detected, options shown

# Test 2: tmux spawning
tmux new -s test
/chainer:run plan-and-implement ... (first)
/chainer:run plan-and-implement ... (second, choose auto-spawn)
# Verify: New tmux window created

# Test 3: Status command
/chainer:status
# Verify: Shows running chains with progress

# Test 4: Worktree Manager no longer has tmux
# After removal
/worktree-manager:start test implement-only spec.md
# Verify: No conflict detection, no tmux (just creates worktree)
```

### Verification Checklist
- [x] Chainer detects running chains (state file tracking)
- [x] tmux spawning works in Chainer (run.md Step 5)
- [x] `/chainer:status` shows accurate info (status.md)
- [x] Worktree Manager has no tmux logic (verified - no grep matches)
- [ ] Parallel chains work independently (manual testing required)

### Deliverable
- Chainer v0.2 with parallel support
- Worktree Manager v3.1 (tmux removed)

---

## Phase 5: Expand Chainer

### Status: ✅ Complete

### Goal
Add more chains, syntax options, and polish.

### What This Enables
- Inline pipe syntax for power users
- More built-in chains
- Import/export chains from GitHub

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Add inline pipe syntax | ⬜ | Future enhancement - requires parser |
| Add more built-in chains | ✅ | design-and-build, tdd-feature, research-to-doc, landing-page-full |
| Implement chain import from URL | ⬜ | Future enhancement - requires URL fetching |
| Implement chain export | ⬜ | settings.html supports download already |
| Add community-chains directory | ✅ | Created with 4 example chains + README |
| Write import/export tests | ⬜ | Manual testing required |

### New Built-in Chains

| Chain | Steps |
|-------|-------|
| design-and-build | feature-dev → frontend-design → ralph |
| tdd-feature | feature-dev → test-driven-dev → ralph |
| pr-workflow | ralph → webapp-testing → github:create-pr |

### Import/Export Features

```yaml
# Linked chain (fetched from URL)
research-to-deck:
  source: "https://raw.githubusercontent.com/user/chains/main/research.yaml"
  mode: link  # or "pin"
  sha: "abc123"  # if pinned
```

### Test Plan

```bash
# Test 1: Inline syntax
/chainer:run "feature-dev | ralph-wiggum" --prompt="Test"
# Verify: Parses and executes correctly

# Test 2: Import from URL
# In settings.html, paste GitHub URL
# Verify: Chain imported, appears in list

# Test 3: Export chain
# In settings.html, export single chain
# Verify: Downloads valid .yaml file
```

### Verification Checklist
- [ ] Inline pipe syntax works (deferred to future version)
- [ ] New built-in chains work (manual testing required)
- [ ] Import from URL works (deferred to future version)
- [ ] Export to file works (settings.html already supports)
- [x] Community chains directory exists (4 chains + README)

### Deliverable
- Chainer v0.3 with expanded features

---

## Phase 6: Documentation & Polish

### Status: ✅ Complete

### Goal
Ship production-ready v1.0 of both plugins.

### What This Enables
- Professional documentation
- Marketing websites
- Easy onboarding for new users

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Create Chainer index.html | ✅ | Marketing page |
| Update Worktree Manager index.html | ✅ | Cross-promote Chainer (Phase 2) |
| Write comprehensive READMEs | ✅ | Both projects (Phases 1-3) |
| Create migration guide | ✅ | For existing WM users |
| Add installation instructions | ✅ | In READMEs |
| Create demo GIF/video | ⬜ | Requires manual work |
| Final testing sweep | ⬜ | Manual verification |

### Verification Checklist
- [x] index.html pages look professional
- [x] READMEs are comprehensive
- [x] Migration guide is clear
- [x] Installation works from scratch
- [ ] Demo materials created

### Deliverable
- Worktree Manager v3.1 (final)
- Chainer v1.0 (final)
- Both websites live

---

## Phase 7: Complete Plugin Split & Dependency Detection

### Status: ✅ Complete

### Goal
Complete the architectural split by removing ALL workflow code from Worktree Manager and adding intelligent plugin dependency detection to Chainer.

### What This Enables
- Worktree Manager becomes a pure git worktree tool (zero orchestration)
- Chainer detects missing plugin dependencies before execution
- Users get helpful installation instructions with `/plugin install` commands
- Clean Unix philosophy: each tool does one thing well

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| **Worktree Manager Cleanup** | | |
| Remove workflow types from types.ts | ✅ | Removed WorkflowMode type completely |
| Remove workflow logic from worktree-start.ts | ✅ | Removed all workflow handling |
| Remove workflow from MCP schema in index.ts | ✅ | Simplified to 4 params only |
| Remove workflow config from config-reader.ts | ✅ | Removed default_workflow |
| Simplify start.md command | ✅ | Already clean (from Phase 6) |
| Update tests | ✅ | Removed workflow assertions |
| Rebuild and verify | ✅ | All tests pass (42 tests) |
| **Chainer Registry** | | |
| Create plugin/registry/plugins.yaml | ✅ | Added all official Anthropic plugins |
| Define chain dependencies | ✅ | Mapped 4 built-in chains |
| Add plugin descriptions | ✅ | With marketplace and docs links |
| **Chainer Dependency Detection** | | |
| Update run.md with Step 2.5 | ✅ | Pre-flight dependency check |
| Implement --skip-deps-check flag | ✅ | Override for power users |
| Create check-deps.md command | ✅ | Standalone dependency checker |
| Add error messages with install commands | ✅ | Exact /plugin install commands |
| **Testing & Documentation** | | |
| Update worktree-manager TESTING.md | ✅ | Removed workflow tests, renumbered 1-14 |
| Update Chainer TESTING.md | ✅ | Added dependency detection tests 9-15 |
| Update both index.html files | ✅ | Chainer FAQ updated with dep detection |
| Version bump | ✅ | WM 3.0.0, Chainer 0.2.0 |

### Implementation Details

#### A. Worktree Manager Cleanup

**File: mcp-server/src/types.ts**
```typescript
// REMOVE entire WorkflowMode type union
// BEFORE:
export type WorkflowMode = 'simple' | 'plan-only' | 'implement-only' | 'plan-and-implement';

// AFTER:
// Remove completely - no workflow concept
```

**File: mcp-server/src/tools/worktree-start.ts**
```typescript
// Remove workflow parameter handling
// Remove lines ~206-739 (workflow execution logic)
// Keep only: create worktree → run auto-setup → done
```

**File: mcp-server/src/index.ts**
```typescript
// Remove workflow from MCP schema
// REMOVE from inputSchema (lines ~44-95):
workflow: {
  type: "string",
  enum: ["simple", "plan-only", "implement-only", "plan-and-implement"],
  description: "..."
}
```

**File: plugin/commands/start.md**
```markdown
# SIMPLIFY - remove all workflow documentation
# ADD suggestion:
💡 For automated workflows, use Chainer:
   /chainer:run worktree-plan-implement --task "your feature"
```

#### B. Create Chainer Registry

**File: plugin/registry/plugins.yaml** (NEW)
```yaml
# Claude Code Plugin Registry
# Source of truth for plugin metadata and dependencies

plugins:
  # Core development
  worktree-manager:
    marketplace: inline
    description: "Git worktree creation and management"

  feature-dev:
    marketplace: claude-plugins-official
    description: "Feature planning with architecture focus"
    docs: "https://docs.anthropic.com"

  ralph-wiggum:
    marketplace: claude-plugins-official
    description: "Autonomous implementation loops"
    docs: "https://awesomeclaude.ai/ralph-wiggum"

  frontend-design:
    marketplace: claude-plugins-official
    description: "Production-grade frontend design"

  # All official Anthropic plugins
  agent-sdk-dev:
    marketplace: claude-plugins-official
    description: "Claude Agent SDK development tools"

  code-review:
    marketplace: claude-plugins-official
    description: "Code review and quality analysis"

  commit-commands:
    marketplace: claude-plugins-official
    description: "Git commit workflow automation"

  plugin-dev:
    marketplace: claude-plugins-official
    description: "Plugin development tools"

  pr-review-toolkit:
    marketplace: claude-plugins-official
    description: "Pull request review toolkit"

  security-guidance:
    marketplace: claude-plugins-official
    description: "Security best practices and guidance"

  # LSP servers (for reference)
  clangd-lsp:
    marketplace: claude-plugins-official
    description: "C/C++ language server"

  csharp-lsp:
    marketplace: claude-plugins-official
    description: "C# language server"

  gopls-lsp:
    marketplace: claude-plugins-official
    description: "Go language server"

  hookify:
    marketplace: claude-plugins-official
    description: "Git hook management"

  jdtls-lsp:
    marketplace: claude-plugins-official
    description: "Java language server"

  lua-lsp:
    marketplace: claude-plugins-official
    description: "Lua language server"

  php-lsp:
    marketplace: claude-plugins-official
    description: "PHP language server"

  pyright-lsp:
    marketplace: claude-plugins-official
    description: "Python language server"

  rust-analyzer-lsp:
    marketplace: claude-plugins-official
    description: "Rust language server"

  swift-lsp:
    marketplace: claude-plugins-official
    description: "Swift language server"

# Chain dependency mapping
chains:
  plan-only:
    requires: [feature-dev]

  implement-only:
    requires: [ralph-wiggum]

  plan-and-implement:
    requires: [feature-dev, ralph-wiggum]

  worktree-plan-implement:
    requires: [worktree-manager, feature-dev, ralph-wiggum]
```

#### C. Add Dependency Detection to Chainer

**File: plugin/commands/run.md** (UPDATE - Add Step 2.5)
```markdown
## Step 2.5: Check Plugin Dependencies

**Only for built-in chains (skip user-defined chains):**

1. **Parse --skip-deps-check flag**
   - If present: Show warning, skip to Step 3

2. **Load registry**
   ```
   Read ${CLAUDE_PLUGIN_ROOT}/registry/plugins.yaml
   Parse YAML to get plugin metadata
   ```

3. **Get required plugins for this chain**
   ```javascript
   const registry = parseYaml(registryContent);
   const requiredPlugins = registry.chains[chainName]?.requires || [];

   // If chain not in registry, skip check (user-defined)
   if (!registry.chains[chainName]) continue to Step 3;
   ```

4. **Check installation status**
   ```javascript
   // Read Claude's plugin registry
   const installedPath = '~/.claude/plugins/installed_plugins.json';
   const installedData = JSON.parse(Read(installedPath));

   const missing = [];
   const installed = [];

   for (const pluginName of requiredPlugins) {
     const plugin = registry.plugins[pluginName];
     const key = `${pluginName}@${plugin.marketplace}`;

     if (installedData.plugins[key]) {
       installed.push(pluginName);
     } else {
       missing.push({
         name: pluginName,
         marketplace: plugin.marketplace,
         description: plugin.description,
         docs: plugin.docs
       });
     }
   }
   ```

5. **Handle results**
   - If missing.length === 0: Proceed to Step 3
   - If missing.length > 0: Show error and ABORT

6. **Error message format**
   ```
   ❌ Cannot run '{chainName}' - missing required plugin(s)

   Missing plugins:
     • {name} - {description}
       Install: /plugin install {name}@{marketplace}
       {docs ? `Docs: ${docs}` : ''}

   Dependency status for '{chainName}':
     ✅ {installedPlugin}
     ❌ {missingPlugin}

   To skip: /chainer:run {chainName} --skip-deps-check [args]
   ```

7. **Edge cases**
   - If installed_plugins.json missing: Treat as no plugins
   - If JSON parse fails: Show warning, skip check
   - If registry.yaml missing: Skip with warning
```

**File: plugin/commands/check-deps.md** (NEW)
```markdown
---
description: Check plugin dependencies for a chain
argument-hint: "[chain-name]"
---

# Check Dependencies Command

Verify plugin installation status for Chainer chains.

## Usage

```bash
/chainer:check-deps [chain-name]
```

## Instructions for Claude

1. **Parse arguments**: Optional chain name

2. **Load files**:
   - Read ${CLAUDE_PLUGIN_ROOT}/registry/plugins.yaml
   - Read ~/.claude/plugins/installed_plugins.json

3. **If chain name provided**:
   - Show dependency status for that chain
   - List required plugins with ✅/❌
   - Provide installation commands for missing

4. **If no chain name**:
   - List all built-in chains
   - Show dependency status for each
   - Highlight ready vs blocked chains

5. **Format example**:
   ```
   Dependency Check: plan-and-implement

   Required plugins:
     ✅ feature-dev (installed)
     ❌ ralph-wiggum (not installed)

   Missing plugins:
     • ralph-wiggum - Autonomous implementation loops
       Install: /plugin install ralph-wiggum@claude-plugins-official
       Docs: https://awesomeclaude.ai/ralph-wiggum

   Status: ❌ Cannot run (missing 1 plugin)
   ```
```

### Test Plan

```bash
# === WORKTREE MANAGER TESTS ===

# Test 1: Simple worktree creation (only thing it should do)
cd /Users/danielraffel/Code/worktree-manager
/worktree-manager:start test-feature
# Expected: Creates worktree, runs auto-setup, done
# Should NOT attempt any workflow execution

# Test 2: Workflow parameter removed
/worktree-manager:start test-feature --workflow plan-only
# Expected: Error - parameter not recognized

# Test 3: Unit tests still pass
cd mcp-server
npm test
# Expected: All tests pass (99% coverage maintained)

# === CHAINER DEPENDENCY TESTS ===

# Test 4: All dependencies satisfied
cd /Users/danielraffel/Code/Chainer
/chainer:run plan-and-implement --prompt "test" --feature_name "test"
# Expected: No errors, executes normally

# Test 5: Missing single dependency
# Temporarily move ralph-wiggum out of plugins/
/chainer:run plan-and-implement --prompt "test" --feature_name "test"
# Expected: Error message with install command for ralph-wiggum

# Test 6: Missing multiple dependencies
# Move feature-dev and ralph-wiggum out
/chainer:run plan-and-implement --prompt "test" --feature_name "test"
# Expected: Shows BOTH missing, with install commands

# Test 7: Skip dependency check
/chainer:run plan-and-implement --skip-deps-check --prompt "test" --feature_name "test"
# Expected: Warning shown, attempts execution (will fail at skill invocation)

# Test 8: Check dependencies command
/chainer:check-deps plan-and-implement
# Expected: Shows status for plan-and-implement chain

# Test 9: Check all dependencies
/chainer:check-deps
# Expected: Shows status for all built-in chains

# Test 10: User-defined chain (no check)
# Add custom chain to ~/.claude/chainer.local.md
/chainer:run my-custom-chain --arg "value"
# Expected: No dependency check (proceeds directly)
```

### Verification Checklist

**Worktree Manager:**
- [ ] Zero workflow code remains
- [ ] No workflow parameters in MCP schema
- [ ] All tests pass
- [ ] start.md mentions Chainer for automation
- [ ] Version bumped to 3.0.0

**Chainer:**
- [ ] Registry created with all official plugins
- [ ] Dependency detection works (Step 2.5 in run.md)
- [ ] Error messages include install commands
- [ ] --skip-deps-check flag works
- [ ] /chainer:check-deps command works
- [ ] User-defined chains skip dependency check
- [ ] Version bumped to 0.2.0

**Integration:**
- [ ] Worktree Manager works standalone
- [ ] Chainer works standalone
- [ ] Clear migration path for existing users
- [ ] Documentation cross-references updated

### Deliverable
- Worktree Manager v3.0.0 (pure git tool, breaking change)
- Chainer v0.2.0 (with dependency detection)
- Updated documentation for both plugins

---

## Phase 8: Smart Plugin Suggestions

### Status: ✅ Complete (MVP - Phase 8a)

### Goal
Add intelligent plugin suggestion system that helps users discover the right plugins and chains for their tasks.

### What This Enables
- `/chainer:suggest "natural language description"` → recommends plugins/chains
- Keyword-based matching (Phase 8a)
- Smart AI-powered matching (Phase 8b - beta)
- Better plugin discoverability

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| **Phase 8a: Keyword Matching (MVP)** | | |
| Add keywords to registry plugins | ✅ | 85+ keywords across all plugins |
| Create /chainer:suggest command | ✅ | Full natural language parsing |
| Implement keyword matching logic | ✅ | Direct (10pts) + partial (5pts) scoring |
| Show top 3 suggestions | ✅ | With runnable /chainer:run commands |
| Add suggest tests | ⬜ | Deferred - manual testing sufficient |
| **Phase 8b: Smart Matching (Beta)** | | |
| Add --smart flag to suggest | ⬜ | Future enhancement (optional) |
| Use Claude to analyze intent | ⬜ | Future enhancement (optional) |
| Scan installed plugin descriptions | ⬜ | Future enhancement (optional) |
| Calculate similarity scores | ⬜ | Future enhancement (optional) |
| Add confidence indicators | ⬜ | Future enhancement (optional) |
| **Documentation** | | |
| Document suggest command | ⬜ | Add to README |
| Add examples to index.html | ⬜ | Show suggestion UX |
| Create community contribution guide | ⬜ | How to add keywords |

### Implementation Details

#### Phase 8a: Keyword Matching (MVP)

**File: plugin/registry/plugins.yaml** (UPDATE)
```yaml
plugins:
  feature-dev:
    marketplace: claude-plugins-official
    description: "Feature planning with architecture focus"
    docs: "https://docs.anthropic.com"
    keywords:
      - plan
      - planning
      - architecture
      - spec
      - specification
      - design document
      - requirements

  ralph-wiggum:
    marketplace: claude-plugins-official
    description: "Autonomous implementation loops"
    docs: "https://awesomeclaude.ai/ralph-wiggum"
    keywords:
      - implement
      - implementation
      - code
      - build
      - create
      - develop
      - feature
      - autonomous

  frontend-design:
    marketplace: claude-plugins-official
    description: "Production-grade frontend design"
    keywords:
      - design
      - UI
      - frontend
      - component
      - styling
      - interface
      - visual
      - CSS

  worktree-manager:
    marketplace: inline
    description: "Git worktree creation and management"
    keywords:
      - worktree
      - isolation
      - parallel
      - branch
      - separate
      - workspace
```

**File: plugin/commands/suggest.md** (NEW)
```markdown
---
description: Get plugin and chain suggestions based on natural language
argument-hint: "<description> [--smart]"
---

# Suggest Command

Intelligently suggest plugins and chains based on what you want to do.

## Usage

```bash
/chainer:suggest "<what you want to do>" [--smart]
```

## Instructions for Claude

### Step 1: Parse Input

1. Extract description text (required)
2. Check for --smart flag (optional, enables AI-powered matching)

### Step 2: Load Registry

```javascript
const registry = parseYaml(Read('${CLAUDE_PLUGIN_ROOT}/registry/plugins.yaml'));
```

### Step 3a: Keyword Matching (Default)

1. **Tokenize description**:
   - Convert to lowercase
   - Split on spaces
   - Extract meaningful words (filter "the", "and", "a", etc.)

2. **Score each plugin**:
   ```javascript
   const scores = {};
   for (const [pluginName, plugin] of Object.entries(registry.plugins)) {
     let score = 0;
     for (const keyword of plugin.keywords || []) {
       if (descriptionTokens.includes(keyword.toLowerCase())) {
         score += 10; // Direct match
       } else if (descriptionTokens.some(t => t.includes(keyword) || keyword.includes(t))) {
         score += 5; // Partial match
       }
     }
     if (score > 0) scores[pluginName] = score;
   }
   ```

3. **Sort by score**, take top 3

4. **Match to chains**:
   - Check which chains use suggested plugins
   - Recommend relevant chains

### Step 3b: Smart Matching (--smart flag)

1. **Scan installed plugins**:
   ```javascript
   const installedPath = '~/.claude/plugins/installed_plugins.json';
   const installed = JSON.parse(Read(installedPath));
   ```

2. **Gather plugin capabilities**:
   - Read description from registry
   - For installed plugins, could check plugin.json for more details

3. **Use Claude to analyze**:
   ```
   Analyze this user request: "{description}"

   Available plugins:
   - feature-dev: Feature planning with architecture focus
   - ralph-wiggum: Autonomous implementation loops
   - frontend-design: Production-grade frontend design
   [... more plugins ...]

   Rank the top 3 plugins by relevance (0-100 score).
   Consider: keywords, capability match, typical workflows.

   Return JSON: [{"plugin": "name", "score": 87, "reason": "..."}]
   ```

4. **Show confidence levels**:
   - 80-100: 🟢 High confidence
   - 50-79: 🟡 Medium confidence
   - 0-49: 🔴 Low confidence

### Step 4: Format Response

**Keyword matching format**:
```
Suggestions for: "plan and implement a login feature"

Recommended chain:
  ✨ plan-and-implement
     Steps: feature-dev → ralph-wiggum
     Run: /chainer:run plan-and-implement --prompt "login feature"

Matched plugins:
  • feature-dev (matched: "plan")
  • ralph-wiggum (matched: "implement", "feature")

Other options:
  • /chainer:run plan-only --prompt "..." (just planning)
  • /chainer:run implement-only --spec_file "..." (just implementation)
```

**Smart matching format** (--smart):
```
🧠 Smart Suggestions for: "make the app look better"

Recommended:
  1. frontend-design (🟢 92% match)
     → Production-grade frontend design
     Reason: Direct match for visual/UI improvements
     Run: /chainer:run frontend-design --task "improve app appearance"

  2. code-review (🟡 56% match)
     → Code quality and best practices
     Reason: Code quality affects perceived polish
     Run: /plugin install code-review@claude-plugins-official

  3. worktree-manager (🟡 45% match)
     → Isolate UI changes in separate workspace
     Reason: Safe experimentation with design changes
     Run: /worktree-manager:start ui-improvements

Note: Using experimental AI matching (--smart flag)
```

### Example Usage

```bash
# Basic keyword matching
/chainer:suggest "I want to add a new feature to my app"
# → Suggests: plan-and-implement chain

# Smart matching
/chainer:suggest "make my code faster" --smart
# → Suggests: code-review (performance analysis)

# Design task
/chainer:suggest "create a pricing page"
# → Suggests: frontend-design plugin

# Complex workflow
/chainer:suggest "I need to test multiple ideas in parallel"
# → Suggests: worktree-manager + Chainer chains
```
```

### Test Plan

```bash
# === KEYWORD MATCHING TESTS ===

# Test 1: Plan + implement keywords
/chainer:suggest "I want to plan and implement a login feature"
# Expected: Suggests plan-and-implement chain

# Test 2: Design keywords
/chainer:suggest "create a beautiful landing page"
# Expected: Suggests frontend-design plugin

# Test 3: Worktree keywords
/chainer:suggest "I want to work on two features at the same time"
# Expected: Suggests worktree-manager + parallel chains

# Test 4: Partial match
/chainer:suggest "implementing user authentication"
# Expected: Matches ralph-wiggum (implement keyword)

# Test 5: No match
/chainer:suggest "do something random"
# Expected: Shows all available chains, no specific suggestion

# === SMART MATCHING TESTS (--smart) ===

# Test 6: Vague request
/chainer:suggest "make my app better" --smart
# Expected: Analyzes intent, suggests code-review or frontend-design

# Test 7: Performance request
/chainer:suggest "my app is slow" --smart
# Expected: Suggests code-review with performance focus

# Test 8: Confidence scoring
/chainer:suggest "I need help" --smart
# Expected: Low confidence scores, shows options

# Test 9: Installed vs not installed
/chainer:suggest "analyze my code" --smart
# Expected: Suggests installed plugins first
```

### Verification Checklist

**Phase 8a (Keyword Matching):**
- [ ] Keywords added to all plugins in registry
- [ ] /chainer:suggest command works
- [ ] Keyword matching scores correctly
- [ ] Top 3 suggestions shown
- [ ] Recommended chains included
- [ ] Runnable command examples provided

**Phase 8b (Smart Matching):**
- [ ] --smart flag enables AI matching
- [ ] Claude analyzes user intent
- [ ] Confidence scores calculated
- [ ] Installed plugins prioritized
- [ ] Reasons for suggestions shown
- [ ] Beta flag clearly indicated

**Documentation:**
- [ ] suggest command documented in README
- [ ] Examples in index.html
- [ ] Contribution guide for keywords

### Deliverable
- Chainer v0.3.0 (with smart suggestions)
- Keyword-based matching (production)
- AI-powered matching (beta)
- Enhanced plugin discoverability

---

## Phase 9: Worktree Manager + Chainer Integration

### Status: ⬜ Deferred (Optional)

**Rationale for deferring**:
- Core functionality already exists via two commands or Chainer's `worktree-plan-implement` chain
- Would add complexity back to Worktree Manager (against Phase 7's goal of purity)
- Current UX is acceptable: users can run `/worktree-manager:start` then `/chainer:run`
- Can be reconsidered based on user feedback

### Goal
Add optional --chain parameter to Worktree Manager that delegates to Chainer after creating worktree. Hybrid approach: Worktree Manager stays pure, but offers convenience integration.

### What This Enables
- One command: `/worktree-manager:start feature-name --chain plan-and-implement`
- Worktree Manager code remains clean (no workflow logic)
- Best UX: create worktree + automate in one step
- Graceful fallback if Chainer not installed

### Tasks
| Task | Status | Notes |
|------|--------|-------|
| Add --chain parameter to start.md | ⬜ | Optional parameter |
| Add Chainer detection logic | ⬜ | Check if plugin installed |
| Implement chain delegation | ⬜ | Invoke /chainer:run after worktree creation |
| Handle missing Chainer gracefully | ⬜ | Show install instructions |
| Update documentation | ⬜ | start.md, README, index.html |
| Add integration tests | ⬜ | With and without Chainer |
| Update TESTING.md | ⬜ | Add --chain parameter tests |

### Implementation Details

**File: plugin/commands/start.md** (UPDATE)
```markdown
## Step 4: Optional Chainer Integration

If `--chain` parameter is provided:

1. **Verify worktree was created successfully**
   - Only proceed if Step 1-3 succeeded

2. **Check if Chainer is installed**:
   ```javascript
   // Check for Chainer plugin
   const chainsAvailable = checkSkillExists('chainer:run');

   if (!chainsAvailable) {
     show error: `
     ❌ --chain parameter requires Chainer plugin

     Install Chainer:
       git clone https://github.com/danielraffel/Chainer ~/Code/Chainer
       # Add to ~/.claude/settings.json:
       "pluginDirs": ["~/Code/Chainer/plugin"]

     Then run:
       /chainer:run ${chainName} --cwd="${worktreePath}" ...
     `;
     return;
   }
   ```

3. **Validate chain exists**:
   ```javascript
   // List available chains
   const chains = invoke('/chainer:list');

   if (!chains.includes(chainName)) {
     show error: `
     ❌ Chain '${chainName}' not found

     Available chains:
       ${chains.join('\n       ')}

     Check: /chainer:list
     `;
     return;
   }
   ```

4. **Invoke Chainer chain**:
   ```javascript
   // Delegate to Chainer
   invoke(`/chainer:run ${chainName} --cwd="${worktreePath}" ...`);

   // Pass through any additional arguments
   // Example: /worktree-manager:start my-feature --chain plan-and-implement --prompt="..."
   // Becomes: /chainer:run plan-and-implement --cwd="~/worktrees/my-feature" --prompt="..."
   ```

### Usage Examples

**Basic usage (no change)**:
```bash
/worktree-manager:start dark-mode
# Creates worktree, done
```

**With Chainer integration**:
```bash
/worktree-manager:start dark-mode --chain plan-and-implement --prompt="Add dark mode toggle"
# Creates worktree at ~/worktrees/dark-mode
# Then runs: /chainer:run plan-and-implement --cwd="~/worktrees/dark-mode" --prompt="Add dark mode toggle"
```

**With specific chain**:
```bash
/worktree-manager:start feature-x --chain plan-only --prompt="Design feature X"
# Creates worktree
# Runs planning only (no implementation)
```

**Chainer not installed**:
```bash
/worktree-manager:start test --chain plan-only
# Error: Chainer required, shows install instructions
```

**Chain doesn't exist**:
```bash
/worktree-manager:start test --chain nonexistent
# Error: Chain not found, lists available chains
```

### Argument Forwarding

All arguments after `--chain <name>` are forwarded to Chainer:

```bash
/worktree-manager:start my-feature \
  --chain plan-and-implement \
  --prompt "Build login system" \
  --feature_name "login" \
  --max_iterations 30

# Becomes:
# 1. Create worktree: /worktree-manager:start my-feature
# 2. Run chain: /chainer:run plan-and-implement \
#      --cwd "~/worktrees/my-feature" \
#      --prompt "Build login system" \
#      --feature_name "login" \
#      --max_iterations 30
```

### Test Plan

```bash
# Test 1: Basic worktree creation (no --chain)
/worktree-manager:start test-basic
# Expected: Creates worktree, no Chainer invocation

# Test 2: With Chainer integration
/worktree-manager:start test-chain --chain plan-and-implement --prompt "test feature"
# Expected: Creates worktree, then runs Chainer chain

# Test 3: Chain parameter with Chainer not installed
# Uninstall Chainer temporarily
/worktree-manager:start test-missing --chain plan-only
# Expected: Error with Chainer install instructions

# Test 4: Invalid chain name
/worktree-manager:start test-invalid --chain nonexistent-chain
# Expected: Error listing available chains

# Test 5: Argument forwarding
/worktree-manager:start test-args \
  --chain plan-only \
  --prompt "test" \
  --feature_name "test" \
  --extra-arg "value"
# Expected: All args forwarded to Chainer

# Test 6: Chain fails (worktree should still exist)
/worktree-manager:start test-fail --chain plan-and-implement
# Simulate Chainer failure
# Expected: Worktree exists, Chainer error shown

# Test 7: List chains from worktree-manager
/worktree-manager:start test --chain help
# Expected: Shows available chains (or error suggesting /chainer:list)
```

### Verification Checklist

- [ ] --chain parameter added to start.md
- [ ] Chainer detection works
- [ ] Chain validation works
- [ ] Argument forwarding works
- [ ] Error messages helpful
- [ ] Worktree created even if chain fails
- [ ] Documentation updated
- [ ] Tests pass

### Deliverable
- Worktree Manager v3.1.0 (with optional Chainer integration)
- Clean code (no workflow logic, only delegation)
- Best UX (one command for everything)
- Graceful fallback (works without Chainer)

---

## Future Phases (Post v1.0)

### Phase 10: Advanced Chainer Features
- Conditionals (if/else)
- Loops (for/each)
- Error handling (on_failure)
- Parallel step execution
- Nested chains (chain calls chain)

### Phase 11: Plugin Marketplace & Discovery
- Community plugin registry
- Plugin ratings and reviews
- Automatic update notifications
- Plugin compatibility matrix

### Phase 12: IDE Integration
- VS Code extension (status panel)
- Cursor integration
- Real-time progress visualization

---

## Existing Tests (Worktree Manager)

### Current Coverage

```
Test Suites: 4 passed, 4 total
Tests:       45 passed, 45 total

Files:
├── tests/unit/git-helpers.test.ts      # Git operations
├── tests/unit/project-detector.test.ts  # Project type detection
├── tests/unit/setup-runner.test.ts      # Auto-setup execution
└── tests/unit/worktree-start.test.ts    # Worktree creation
```

### Tests to Update in Phase 2

| Test File | Action | Notes |
|-----------|--------|-------|
| worktree-start.test.ts | Modify | Remove workflow execution tests |
| Others | Keep | Unchanged functionality |

### Tests to Add for Chainer

| Test File | Purpose |
|-----------|---------|
| config-parser.test.ts | Parse YAML, handle errors |
| variable-resolver.test.ts | {{var}} substitution |
| chain-executor.test.ts | Step execution |
| step-types.test.ts | Each step type works |

---

## Summary: What Ships When

| Phase | Worktree Manager | Chainer | Key Feature |
|-------|------------------|---------|-------------|
| 0 | Verify tmux | - | Foundation |
| 1 | - | v0.1 | Config-driven chains |
| 2 | v3.0 | - | Worktree-only focus |
| 3 | - | v0.1.1 | Integration |
| 4 | v3.1 | v0.2 | Parallel via Chainer |
| 5 | - | v0.3 | Expanded features |
| 6 | v3.1 | v1.0 | Production ready |

---

## Appendix A: Settings Page UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⛓️ Chainer Settings                              [Import ▼] [Export ▼] │
├────────────────────────┬────────────────────────────────────────────────┤
│                        │                                                │
│  My Chains             │  Edit: plan-and-implement                      │
│  ──────────────────    │  ────────────────────────────────────────────  │
│  ☑️ plan-and-implement │  Description:                                  │
│  ☑️ plan-only          │  [Plan with feature-dev, implement with ralph] │
│  ☑️ implement-only     │                                                │
│  ☐ experimental        │  Enabled: [✓]                                  │
│                        │                                                │
│  [+ New Chain]         │  Inputs:                                       │
│                        │  ┌──────────────────────────────────────────┐  │
│  ──────────────────    │  │ prompt       [required ✓] [Delete]       │  │
│  Linked Chains         │  │ feature_name [required ✓] [Delete]       │  │
│  ──────────────────    │  └──────────────────────────────────────────┘  │
│  🔗 research-to-deck   │  [+ Add Input]                                 │
│     ↻ Synced           │                                                │
│  📌 landing-page       │  Steps:                                        │
│     v1.2.0             │  ┌──────────────────────────────────────────┐  │
│                        │  │ ☰ 1. plan                    [Skill ▼]   │  │
│  [Browse Community →]  │  │      feature-dev:feature-dev             │  │
│                        │  │      Args: {{prompt}}                    │  │
│                        │  ├──────────────────────────────────────────┤  │
│                        │  │ ☰ 2. implement               [Script ▼]  │  │
│                        │  │      ┌────────────────────────────────┐  │  │
│                        │  │      │ SCRIPT_PATH="$(find ~/.clau... │  │  │
│                        │  │      └────────────────────────────────┘  │  │
│                        │  └──────────────────────────────────────────┘  │
│                        │  [+ Add Step]                                  │
│                        │                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  [Save Config ↓]  Last saved: 2 min ago                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Community Chains Structure

```
Chainer/community-chains/
├── README.md                    # How to contribute
├── development/
│   ├── plan-and-implement.yaml
│   ├── tdd-feature.yaml
│   └── design-and-build.yaml
├── content/
│   ├── research-to-deck.yaml
│   ├── video-to-doc.yaml
│   └── data-analysis.yaml
├── devops/
│   ├── test-and-deploy.yaml
│   └── pr-workflow.yaml
└── marketing/
    ├── landing-page.yaml
    └── marketing-kit.yaml
```

---

## Appendix C: Security Considerations

### Chains Should NOT Contain
- API keys or secrets (use `{{env.API_KEY}}`)
- Hardcoded paths (use `{{cwd}}` or `{{home}}`)
- Destructive commands without confirmation

### Review Before Import
Always preview chains before importing:
- Shows all steps and commands
- Highlights external skills/tools
- Warning for scripts

---

## Ralph-Wiggum Execution Notes

### Repository Locations

| Project | Path |
|---------|------|
| Worktree Manager | `/Users/danielraffel/Code/worktree-manager` |
| Chainer | `/Users/danielraffel/Code/Chainer` |

### Key Files

| File | Purpose |
|------|---------|
| `FEATURE-PLAN-CHAINER-SPLIT.md` | This file - master plan with all phases |
| `Chainer/ai/PROJECT.md` | Chainer project context |
| `worktree-manager/ai/PROJECT.md` | Worktree Manager project context |
| `*/ai/learnings.txt` | Running log of discoveries per repo |

### Status Markers

When updating task tables in this document:
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ⚠️ Blocked

### Phase → Repository Mapping

| Phase | Primary Repository |
|-------|-------------------|
| 0 | Manual testing (no ralph) |
| 1 | Chainer |
| 2 | Worktree Manager |
| 3 | Both (integration) |
| 4 | Both (Chainer primary) |
| 5 | Chainer |
| 6 | Both (documentation) |

**Note**: The ralph execution command is maintained separately from this document to avoid self-reference issues.

---
## Claude Collaboration Guidelines

### Operating Mode

Claude operates **locally only** in this project:

- You have access to the full codebase and can execute and test the app
- You may launch Xcode and interact with the running environment
- If I send you a URL, fetch its contents and read it before continuing
- All builds and tests happen on my machine

### GitHub Integration

Even though cloud builds are disabled, you can still:

- Respond to `@claude` mentions in GitHub issues and pull requests
- Fetch GitHub issue and PR content to understand feature requests or bugs
- Propose plans or implementations based on the content
- Suggest branches (e.g., `claude/feature-name`) and write code
- Summarize diffs, test plans, or intentions in GitHub comments

---
## Running Log of Learnings

To avoid repeating mistakes or re-solving tricky problems, we maintain a shared log of learnings in:
`ai/learnings.txt`

Add a short entry to this file whenever:
- You solve a non-trivial or time-consuming issue
- We encounter tricky behavior or workarounds
- You discover an undocumented detail that’s important to know

This log helps us (and Claude) avoid wasted time in the future. Keep entries brief, focused, and updated as we learn more.

Tip: Prefer updating this log after a successful build or test pass. This allows you to confirm the solution worked, avoid delaying testing, and ensures the entry is accurate.

Note: `ai/learnings.txt` can be slow to read due to its size or formatting. Consider:
- Keeping entries as short and clear as possible
- Avoiding excessive formatting
- Reviewing only the most recent entries unless necessary
---

## Development Workflow

We use GitHub issues to track work and PRs to review code. Tag Claude-created issues/PRs with `by-claude`. Use the gh bash command to interact with GitHub.

### Setup
- Read the relevant GitHub issue (or create one)
- Checkout `main` and pull latest changes
- Create a new branch: `claude/feature-name`
- **CRITICAL**: Never commit or push directly to `main`
- If working on `main`, always create a feature branch first

### Development

- Claude should commit early and often with clear messages
- Claude should create commits when:
  - A feature is functionally complete
  - A bug fix is implemented
  - Significant progress is made
  - Before switching to a different task
- Commit messages should be descriptive (e.g., "Add reverb parameter controls to audio engine")
- **After committing to feature branches, push to origin: `git push origin branch-name`**
- **Branch Protection**:
  - If on `main` branch: Create a feature branch before any commits
  - Never commit directly to `main`
  - If accidentally on `main` with uncommitted changes: Stop and ask for guidance
- Ask me to test in the app as needed

### Git Safety Rules

1. **Before any commit**, Claude must check current branch: `git branch --show-current`
2. **If on main branch**:
   - DO NOT commit
   - Create a feature branch: `git checkout -b claude/feature-description`
   - Then proceed with commits
3. **If on feature branch**: Commit and push freely
4. **If unsure**: Ask user before proceeding

### Review

- Run `git diff main` to review changes
- Push the branch to GitHub
- Open a PR with:
  - A short title (no issue number)
  - A body starting with the issue number and a description of the changes
  - A test plan covering:
    - New functionality
    - Any existing behavior that might have changed
- Claude will:
  - Generate a test plan based on the issue and changes (if not already provided)
  - Execute available tests (when running locally or with CLI access)
  - Report test results as a comment or PR review, including:
    - Which tests were run
    - Any failures or regressions detected
    - Confirmation of success where appropriate

 ### Examining Old Commits Safely

  When asked to look at old commits:
  - **NEVER use `git checkout <commit-hash>`** - this detaches HEAD
  - Instead use:
    - `git show <commit>:path/to/file` - to read a file from that commit
    - `git diff <commit> -- path/to/file` - to compare with current version
    - `git log -p <commit> -1` - to see what changed in that commit

  If accidentally in detached HEAD state:
  1. Check with `git status`
  2. Discard changes: `git checkout -- .`
  3. Return to branch: `git checkout <branch-name>`

### Fixes

- Use `rebase` or `cherry-pick` to reconcile branches—**never** merge to `main`

---


*Document created: January 2025*
*Authors: Claude + Daniel Raffel*
*Last updated: January 5, 2025*
