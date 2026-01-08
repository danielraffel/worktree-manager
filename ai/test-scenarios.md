# Test Scenarios for Parallel Workflow Support

## Overview
This document describes test scenarios to verify the parallel workflow conflict detection and handling works correctly in the worktree-manager plugin.

## Prerequisites
- Plugin installed at `~/worktree-manager/plugin`
- MCP server built and available
- Git repository for testing
- tmux installed: `/opt/homebrew/bin/tmux`

## Test Scenario 1: No Conflict (Baseline)

**Setup:**
- No existing ralph loop running
- No `.claude/ralph-loop.local.md` file

**Test Steps:**
1. Run: `/worktree-manager:start test-feature implement-only audit/spec.md`

**Expected Result:**
- Worktree created successfully
- NO conflict detection triggered
- Ralph loop starts directly
- Shows "🔄 Ralph loop activated"
- Implementation begins

**Verification:**
- No launcher script created
- No conflict messaging shown
- Ralph works normally

---

## Test Scenario 2: Conflict - tmux Installed, Strategy "ask" (In tmux)

**Setup:**
- Ralph loop already running in worktree A
- `.claude/ralph-loop.local.md` exists
- tmux is installed
- Currently inside a tmux session (`$TMUX` is set)
- No config file (defaults to "ask")

**Test Steps:**
1. Start first worktree: `/worktree-manager:start feature-a implement-only audit/spec-a.md`
2. Let it run (don't complete)
3. In same session, start second: `/worktree-manager:start feature-b implement-only audit/spec-b.md`

**Expected Result:**
- Conflict detected
- Launcher script created at `~/worktrees/feature-b/start-claude.sh`
- Shows message:
  ```
  ⚠️  Another ralph loop is running (feature-a)

  Choose how to run feature-b:

  A) Auto-spawn in new tmux window (instant, recommended)
  B) Copy command to paste in new terminal
  C) Replace current loop (feature-a will stop)
  D) Cancel

  Your choice (A/B/C/D):
  ```

**Verification:**
- If user chooses A: New tmux window created, feature-b runs there
- If user chooses B: Command copied to clipboard, session exits
- If user chooses C: feature-a loop stops, feature-b loop starts in current session
- If user chooses D: Session exits, nothing changes

---

## Test Scenario 3: Conflict - tmux Installed, Strategy "ask" (Not in tmux)

**Setup:**
- Ralph loop already running
- tmux is installed
- NOT currently in tmux (`$TMUX` is empty)
- No config file (defaults to "ask")

**Test Steps:**
1. Start first worktree (let it run)
2. Start second worktree from same directory

**Expected Result:**
- Conflict detected
- Shows message:
  ```
  ⚠️  Another ralph loop is running (feature-a)

  Choose how to run feature-b:

  A) Auto-spawn in tmux session (automatic, recommended)
  B) Copy command to paste in new terminal
  C) Replace current loop (feature-a will stop)
  D) Cancel

  💡 Tip: Run 'tmux new -s work' before Claude for instant window spawning

  Your choice (A/B/C/D):
  ```

**Verification:**
- If user chooses A: Detached tmux session created, attach command copied
- If user chooses B: Launch script command copied to clipboard
- If user chooses C: Current loop replaced
- If user chooses D: Exit

---

## Test Scenario 4: Conflict - tmux Installed, Strategy "always"

**Setup:**
- Ralph loop already running
- tmux installed
- Config file with `auto_spawn_strategy: "always"`
- Test both in tmux and not in tmux

**Create config:**
```bash
mkdir -p .claude
cat > .claude/worktree-manager.local.md <<'EOF'
---
auto_spawn_strategy: "always"
---
EOF
```

**Test Steps - In tmux:**
1. Start tmux session: `tmux new -s test`
2. Start first worktree (let it run)
3. Start second worktree

**Expected Result (In tmux):**
- Conflict detected
- NO prompting - auto-spawns immediately
- Shows message:
  ```
  ✅ Spawned feature-b in new tmux window
     Press Ctrl+b n to switch to it
  ```
- New tmux window created automatically
- Current session exits (doesn't run ralph)

**Test Steps - Not in tmux:**
1. Exit tmux
2. Start first worktree (let it run)
3. Start second worktree

**Expected Result (Not in tmux):**
- Conflict detected
- NO prompting - auto-spawns immediately
- Shows message:
  ```
  ✅ Started feature-b in tmux session
     To see it, run:

     tmux attach -t feature-b

  📋 Command copied to clipboard!
  ```
- Detached tmux session created
- Current session exits

**Verification:**
- Check new tmux window/session exists: `tmux list-windows` or `tmux list-sessions`
- Verify feature-b is running in new context
- Verify feature-a continues in original context

---

## Test Scenario 5: Conflict - tmux Installed, Strategy "never"

**Setup:**
- Ralph loop already running
- tmux installed
- Config file with `auto_spawn_strategy: "never"`

**Create config:**
```bash
cat > .claude/worktree-manager.local.md <<'EOF'
---
auto_spawn_strategy: "never"
---
EOF
```

**Test Steps:**
1. Start first worktree (let it run)
2. Start second worktree

**Expected Result:**
- Conflict detected
- Shows message:
  ```
  ⚠️  Another ralph loop is running (feature-a)

  To run feature-b in parallel without conflicts:

  1. Open a new terminal
  2. Paste this command:
     ~/worktrees/feature-b/start-claude.sh

  📋 Command copied to clipboard!

  Or continue here to REPLACE the current loop (feature-a will stop).

  What would you like to do?
  A) I'll paste in a new terminal (recommended for parallel work)
  B) Replace current loop with feature-b
  C) Cancel
  ```

**Verification:**
- Clipboard contains launch script path
- Only shows A/B/C options (no tmux auto-spawn)
- Launcher script is executable

---

## Test Scenario 6: Conflict - No tmux Installed

**Setup:**
- Ralph loop already running
- tmux NOT installed
- Verify with: `command -v tmux` returns empty

**Test Steps:**
1. Start first worktree (let it run)
2. Start second worktree

**Expected Result:**
- Conflict detected
- Shows message:
  ```
  ⚠️  Another ralph loop is running (feature-a)

  To run feature-b in parallel without conflicts:

  1. Open a new terminal
  2. Paste this command:
     ~/worktrees/feature-b/start-claude.sh

  📋 Command copied to clipboard!

  Or continue here to REPLACE the current loop (feature-a will stop).

  What would you like to do?
  A) I'll paste in a new terminal (recommended for parallel work)
  B) Replace current loop with feature-b
  C) Cancel

  💡 Tip: Install tmux for automatic parallel workflows: brew install tmux
  ```

**Verification:**
- Shows tip about installing tmux
- Only shows A/B/C options (no tmux options)
- Launcher script works when pasted in new terminal

---

## Test Scenario 7: plan-and-implement Workflow Conflict

**Setup:**
- Ralph loop running from implement-only workflow
- Now starting plan-and-implement workflow
- tmux installed, strategy "ask"

**Test Steps:**
1. Start: `/worktree-manager:start feature-a implement-only audit/spec-a.md`
2. Let ralph run
3. Start: `/worktree-manager:start feature-b plan-and-implement "Add new feature"`

**Expected Result:**
- Worktree created
- feature-dev runs and creates spec
- THEN conflict detection triggers (after planning, before implementation)
- Shows same conflict handling options
- Can choose to spawn in parallel or replace

**Verification:**
- feature-dev completes before conflict check
- Spec file created in audit/
- Conflict handling works same as implement-only

---

## Test Scenario 8: Launcher Script Verification

**Setup:**
- Any conflict scenario that creates a launcher script

**Test Steps:**
1. Trigger conflict, get launcher script created
2. Examine script: `cat ~/worktrees/<feature>/start-claude.sh`
3. Open new terminal
4. Run script: `~/worktrees/<feature>/start-claude.sh`

**Expected Script Contents:**
```bash
#!/bin/bash
cd "$(dirname "$0")"
exec claude --plugin-dir ~/worktree-manager/plugin
```

**Expected Result:**
- Script is executable (`chmod +x` was applied)
- Script changes to worktree directory
- Script launches Claude with plugin-dir pointing to worktree-manager
- New Claude session starts in worktree context
- No state file conflicts (new session has own `.claude/` context)

**Verification:**
- `pwd` in new session shows worktree path
- Can run ralph loop without conflicts
- Both sessions work independently

---

## Test Scenario 9: Config Priority (Global vs Project)

**Setup:**
- Global config: `~/.claude/worktree-manager.local.md` with `auto_spawn_strategy: "always"`
- Project config: `.claude/worktree-manager.local.md` with `auto_spawn_strategy: "never"`

**Create configs:**
```bash
# Global
mkdir -p ~/.claude
cat > ~/.claude/worktree-manager.local.md <<'EOF'
---
auto_spawn_strategy: "always"
---
EOF

# Project
mkdir -p .claude
cat > .claude/worktree-manager.local.md <<'EOF'
---
auto_spawn_strategy: "never"
---
EOF
```

**Test Steps:**
1. Start first worktree (let it run)
2. Start second worktree

**Expected Result:**
- Project config takes precedence
- Behavior matches "never" strategy (copy command, no auto-spawn)
- Global config is ignored

**Verification:**
- Check logic in command implementation
- Verify project config is checked first

---

## Test Scenario 10: Feature Name Extraction

**Setup:**
- Create a worktree with a specific feature name
- Start ralph loop
- Verify conflict message shows correct feature name

**Test Steps:**
1. Start: `/worktree-manager:start my-awesome-feature implement-only audit/spec.md`
2. Let ralph run
3. Start second worktree

**Expected Result:**
- Conflict message shows:
  ```
  ⚠️  Another ralph loop is running (my-awesome-feature)
  ```

**Verification:**
- Feature name extracted correctly from state file path
- Matches actual feature name, not "another feature" fallback

---

## Success Criteria

All test scenarios should:
- ✅ Detect conflicts correctly
- ✅ Create valid launcher scripts
- ✅ Respect config strategy settings
- ✅ Show appropriate messaging
- ✅ Handle tmux presence/absence gracefully
- ✅ Allow parallel workflows without interference
- ✅ Support replacing workflows when desired
- ✅ Copy commands to clipboard correctly
- ✅ Work for both implement-only and plan-and-implement workflows

---

## Manual Testing Checklist

- [ ] Test Scenario 1: No conflict baseline
- [ ] Test Scenario 2: Conflict with tmux, "ask", in tmux
- [ ] Test Scenario 3: Conflict with tmux, "ask", not in tmux
- [ ] Test Scenario 4: Conflict with tmux, "always"
- [ ] Test Scenario 5: Conflict with tmux, "never"
- [ ] Test Scenario 6: Conflict without tmux
- [ ] Test Scenario 7: plan-and-implement workflow conflict
- [ ] Test Scenario 8: Launcher script works
- [ ] Test Scenario 9: Config priority (project > global)
- [ ] Test Scenario 10: Feature name extraction

---

## Notes

- These are manual test scenarios since the plugin executes via Claude Code
- Each scenario should be tested in a real environment
- Consider automating clipboard checks if possible
- Verify tmux commands don't interfere with user's existing tmux sessions
- Test cleanup: Remove test worktrees and config files after testing
