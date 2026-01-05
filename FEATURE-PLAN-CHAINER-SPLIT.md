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
| Phase 5: Expand Chainer | 🔄 In Progress |
| Phase 6: Documentation | 🔄 In Progress |

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

### Status: 🔄 In Progress

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

### Status: 🔄 In Progress

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

## Future Phases (Post v1.0)

### Phase 7: Advanced Chainer Features
- Conditionals (if/else)
- Loops (for/each)
- Error handling (on_failure)
- Parallel step execution
- Nested chains (chain calls chain)

### Phase 8: Ecosystem Integration
- More community chains
- Natural language → plugin mapping
- Chain marketplace
- Popularity/rating system

### Phase 9: IDE Integration
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
