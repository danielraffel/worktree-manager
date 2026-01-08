# Parallel Worktree Issue with Ralph-Wiggum

**Status**: Known Issue
**Created**: 2025-12-31
**Severity**: Medium (affects parallel workflow UX)

---

## Problem Statement

The core purpose of worktree-manager is to enable **parallel development** - working on multiple features simultaneously in isolated worktrees. However, ralph-wiggum's state file design creates cross-contamination when running multiple loops from the same parent directory.

### What Happens

**Scenario**: User wants to run two ralph loops in parallel
```bash
# Terminal 1: In ~/my-project
claude --plugin-dir ~/worktree-manager/plugin
/worktree-manager:start feature-a implement-only spec-a.md
# Ralph loop starts, creates ~/my-project/.claude/ralph-loop.local.md

# Terminal 2: In ~/my-project (same directory!)
claude --plugin-dir ~/worktree-manager/plugin
/worktree-manager:start feature-b implement-only spec-b.md
# ❌ This sees the SAME .claude/ralph-loop.local.md
# ❌ Ralph loop from feature-a interferes with feature-b
```

**Root cause**: Ralph-wiggum's Stop hook looks for `.claude/ralph-loop.local.md` relative to the Claude session's **current working directory**, not the worktree directory.

---

## Technical Details

### Ralph State File Location

The ralph-wiggum plugin creates: `$PWD/.claude/ralph-loop.local.md`

Where `$PWD` is the directory where you launched Claude, NOT the worktree path.

**Example**:
```bash
# If you run this from ~/my-project:
cd ~/my-project
claude --plugin-dir ~/worktree-manager/plugin
/worktree-manager:start auth implement-only spec.md

# State file is created at:
~/my-project/.claude/ralph-loop.local.md

# Ralph works in:
~/worktrees/auth/

# But the Stop hook looks for state file in:
~/my-project/.claude/  # ← This is the problem!
```

### Why This Breaks Parallel Workflows

When you launch multiple Claude sessions from the same directory:
1. First session creates `.claude/ralph-loop.local.md`
2. Second session sees the same file
3. Both sessions think they should loop with the SAME instructions
4. Cross-contamination: wrong prompts, wrong worktree paths, chaos

---

## Current Workaround

**Run each Claude session from within its worktree directory:**

```bash
# Terminal 1:
cd ~/worktrees/feature-a
claude --plugin-dir ~/worktree-manager/plugin
/worktree-manager:start feature-a implement-only spec-a.md
# State file: ~/worktrees/feature-a/.claude/ralph-loop.local.md

# Terminal 2:
cd ~/worktrees/feature-b
claude --plugin-dir ~/worktree-manager/plugin
/worktree-manager:start feature-b implement-only spec-b.md
# State file: ~/worktrees/feature-b/.claude/ralph-loop.local.md

# ✅ Each has isolated .claude/ directory
```

**Pros**:
- Simple, works today
- Each worktree gets isolated ralph state
- Can run unlimited parallel loops

**Cons**:
- Manual steps: create worktree → exit Claude → cd to worktree → relaunch
- Not discoverable (users won't know to do this)
- Defeats the "one command" UX

---

## Potential Solutions

### Option 1: Auto-Copy Launch Command (Universal)

**Idea**: When conflict detected, auto-generate and copy the launch command to clipboard

**Implementation**:
```markdown
When /worktree-manager:start detects a conflict:

⚠️  Another ralph loop is running (feature-a)

To run feature-b in parallel:

  cd ~/worktrees/feature-b && claude --plugin-dir ~/worktree-manager/plugin

📋 Command copied to clipboard! Just paste in a new terminal.
```

**Enhancement**: Create launcher script in worktree
```bash
# Plugin creates: ~/worktrees/feature-b/start-claude.sh
#!/bin/bash
cd "$(dirname "$0")"
exec claude --plugin-dir ~/worktree-manager/plugin

# Then tells user:
~/worktrees/feature-b/start-claude.sh
📋 Copied to clipboard!
```

**Pros**:
- Works on all terminals (Terminal, iTerm, VS Code, Warp)
- No dependencies required
- One paste to launch
- Launch script can be reused anytime

**Cons**:
- Still requires manual paste (but very easy)
- User needs to open new terminal manually

### Option 1b: Smart Detection & Instructions

**Idea**: Detect when ralph will be used and tell the user to cd/relaunch

**Implementation**:
```markdown
When /worktree-manager:start detects implement-only or plan-and-implement:

Instead of running ralph immediately, output:

✅ Worktree created: ~/worktrees/feature-a

⚠️  For parallel ralph workflows, run from the worktree directory:

Open a new terminal and run:
  cd ~/worktrees/feature-a
  claude --plugin-dir ~/worktree-manager/plugin
  # Then continue with the implementation

This ensures ralph state is isolated to this worktree.

Alternatively, continue here if you're only running one ralph loop at a time.
```

**Pros**:
- Minimal code change
- Educates users about the limitation
- Users can choose to ignore if not doing parallel work

**Cons**:
- Still manual steps
- Users might ignore the warning
- Not automated

### Option 2: Helper Script (wtree alias)

**Idea**: Create a shell script/alias that automates the full flow

**Implementation**:
```bash
# ~/worktree-manager/bin/wtree
#!/bin/bash

FEATURE_NAME=$1
WORKFLOW=$2
shift 2
ARGS="$@"

# 1. Create worktree via MCP tool
cd ~/my-project
claude --plugin-dir ~/worktree-manager/plugin <<EOF
/worktree-manager:start $FEATURE_NAME $WORKFLOW $ARGS --no-auto-run
EOF

# 2. cd to worktree
cd ~/worktrees/$FEATURE_NAME

# 3. Launch Claude in that directory
claude --plugin-dir ~/worktree-manager/plugin
```

**Usage**:
```bash
wtree my-feature implement-only spec.md
# Automatically:
# 1. Creates worktree
# 2. cd to it
# 3. Launches Claude there
# 4. User then manually starts ralph
```

**Pros**:
- One command from user perspective
- Automates the cd/relaunch flow
- Could open new terminal tab/window

**Cons**:
- Requires external script (not pure plugin)
- Shell scripting complexity (terminal tab handling varies by OS/terminal)
- Still requires user to run the ralph command manually after launch

### Option 3: Smart State File Path Override

**Idea**: Override where ralph creates its state file

**Implementation**:
Modify the setup script call to use a custom state file location:

```bash
# Instead of letting ralph create .claude/ralph-loop.local.md in cwd
# Tell it to create in the worktree directory

# Current:
SCRIPT_PATH="..." && bash "$SCRIPT_PATH" "prompt..." --max-iterations 50

# New (hypothetical - requires ralph-wiggum change):
SCRIPT_PATH="..." && bash "$SCRIPT_PATH" "prompt..." \
  --state-file ~/worktrees/feature-a/.claude/ralph-loop.local.md \
  --max-iterations 50
```

**Pros**:
- True fix, not workaround
- Enables parallel workflows seamlessly
- No UX changes needed

**Cons**:
- **Requires upstream ralph-wiggum changes** (we don't control that plugin)
- Ralph's Stop hook would also need to support custom state paths
- Unlikely to be implemented by Anthropic for this use case

### Option 4: Worktree-Specific Claude Launch Command

**Idea**: Generate a ready-to-paste command that opens in the worktree

**Implementation**:
```markdown
When /worktree-manager:start finishes:

✅ Worktree created: ~/worktrees/feature-a

To run ralph in an isolated session:

1. Open a new terminal
2. Copy and paste this command:

   cd ~/worktrees/feature-a && claude --plugin-dir ~/worktree-manager/plugin

3. Then run:
   /continue-ralph feature-a

[Or click here to copy command to clipboard]
```

**With enhanced terminal integration** (if supported):
- Plugin could output a terminal escape sequence that opens a new tab
- Auto-populates the command
- User just hits Enter

**Pros**:
- Clear instructions
- Could be automated if terminal supports it
- Educational (teaches the workaround)

**Cons**:
- Still manual
- Terminal automation is unreliable across different terminals

### Option 5: Auto-Spawn with tmux (Automatic)

**Idea**: Automatically spawn isolated Claude sessions using tmux - no user tmux knowledge needed

**User already has tmux installed** (check with `which tmux`)

**Implementation**:
```bash
# When conflict detected:

# 1. Detect tmux availability
if command -v tmux >/dev/null 2>&1; then
  HAS_TMUX=true
fi

# 2. Check if user is already in tmux
if [ -n "$TMUX" ]; then
  IN_TMUX=true
fi

# 3. Auto-spawn based on context:

# Case A: User is already in tmux
if [ "$IN_TMUX" = true ]; then
  tmux new-window -c ~/worktrees/feature-b \
    -n "feature-b" \
    "claude --plugin-dir ~/worktree-manager/plugin"

  echo "✅ Spawned feature-b in new tmux window"
  echo "   Press Ctrl+b n to switch to it"
fi

# Case B: User is NOT in tmux, but has it installed
if [ "$HAS_TMUX" = true ] && [ "$IN_TMUX" != true ]; then
  tmux new-session -d -s feature-b \
    -c ~/worktrees/feature-b \
    "claude --plugin-dir ~/worktree-manager/plugin"

  echo "✅ Started feature-b in background tmux session"
  echo "   To see it, run: tmux attach -t feature-b"
  echo "📋 Copied to clipboard!"
fi

# Case C: No tmux
if [ "$HAS_TMUX" != true ]; then
  echo "💡 Install tmux for automatic spawning: brew install tmux"
  echo "   For now, paste this command: cd ~/worktrees/feature-b && claude ..."
fi
```

**User Experience**:
```bash
# User workflow (no tmux commands needed):

# Terminal 1:
tmux new -s work  # Only need this once
/worktree-manager:start feature-a implement-only spec-a.md
→ ✅ Working on feature-a

# Still in Terminal 1:
/worktree-manager:start feature-b implement-only spec-b.md
→ ⚠️ Conflict detected. Auto-spawning feature-b...
→ ✅ Spawned in new window. Press Ctrl+b n to see it

# Press Ctrl+b n
→ Now in feature-b's window, fully isolated

# Press Ctrl+b p
→ Back to feature-a's window

# Both running in parallel, zero conflicts!
```

**With config option**:
```yaml
# .claude/worktree-manager.local.md
---
auto_spawn_strategy: "always"  # "ask" | "always" | "never"
---
```

- `ask` (default): Prompt user with options
- `always`: Auto-spawn if tmux available (no prompt)
- `never`: Always use copy-to-clipboard

**Pros**:
- ✅ Truly automatic - no manual steps
- ✅ User never needs to learn tmux commands
- ✅ Works across all terminals
- ✅ Can run unlimited parallel features
- ✅ tmux is already installed on most dev machines

**Cons**:
- ⚠️ Requires tmux (but can auto-detect and fall back)
- ⚠️ Keybinding conflicts in some terminals (VS Code)
- ⚠️ User might not know they're in tmux

### Option 6: State File Symlink Swapping (Hacky but Works)

**Idea**: Create state file in worktree, symlink it to session cwd

**Implementation**:
```bash
# When starting feature-b while feature-a is running:

# 1. Backup current state file (feature-a)
if [ -f .claude/ralph-loop.local.md ]; then
  mv .claude/ralph-loop.local.md .claude/ralph-loop-feature-a.backup
fi

# 2. Create state file in feature-b's worktree
mkdir -p ~/worktrees/feature-b/.claude
cat > ~/worktrees/feature-b/.claude/ralph-loop.local.md <<EOF
---
active: true
iteration: 1
feature_name: feature-b
---
CRITICAL: Work ONLY in ~/worktrees/feature-b/...
EOF

# 3. Symlink to current session's .claude/
ln -sf ~/worktrees/feature-b/.claude/ralph-loop.local.md .claude/ralph-loop.local.md

# Now Stop hook finds state file via symlink
# But actual file lives in worktree directory
```

**Swapping between features**:
```bash
# Plugin provides /worktree-manager:switch command

/worktree-manager:switch feature-a
→ Removes current symlink
→ Restores feature-a's state file or symlinks to it
→ ✅ Now working on feature-a

/worktree-manager:switch feature-b
→ Backs up current state
→ Creates/restores symlink to feature-b's state
→ ✅ Now working on feature-b
```

**Pros**:
- Works in same terminal (no new windows needed)
- Each worktree maintains its own state
- Can switch between features easily

**Cons**:
- ⚠️ Fragile if multiple terminals access same .claude/ simultaneously
- ⚠️ Race conditions possible
- ⚠️ State corruption risk if timing is wrong
- ⚠️ Requires careful state management
- ⚠️ Only one active loop per session at a time

**Verdict**: Interesting hack, but too fragile for production use. Better to use tmux auto-spawn.

### Option 7: Background Session Management (Advanced)

**Idea**: Plugin spawns isolated Claude sessions for each worktree

**Implementation**:
```typescript
// Pseudo-code
async function startRalphInWorktree(worktreePath: string, prompt: string) {
  // Spawn a new Claude process in the worktree directory
  const child = spawn('claude', ['--plugin-dir', PLUGIN_PATH], {
    cwd: worktreePath,
    detached: true,
    stdio: 'ignore'
  });

  // Send ralph command to that session
  child.stdin.write(`/ralph-loop "${prompt}" --max-iterations 50\n`);

  // Detach and let it run
  child.unref();
}
```

**Pros**:
- Fully automated
- True parallel execution
- No user steps needed

**Cons**:
- **Very complex** - managing child processes, stdio, session state
- Hard to monitor/debug
- Might not work with Claude's architecture
- Security/safety concerns with automated sessions
- Probably not feasible

---

## Recommended Approach

**✅ DECISION: Implement Option 1 + Option 5 (Hybrid with Smart Defaults)**

### Phase 1 (Ship Now): Auto-Copy + Launch Scripts

**Universal solution that works everywhere**:

1. Detect conflict (existing `.claude/ralph-loop.local.md`)
2. Create launch script: `~/worktrees/feature-b/start-claude.sh`
3. Auto-copy command to clipboard: `~/worktrees/feature-b/start-claude.sh`
4. Show user-friendly message:
   ```
   ⚠️  Another ralph loop is running (feature-a)

   To run feature-b in parallel, paste this in a new terminal:
   ~/worktrees/feature-b/start-claude.sh

   📋 Copied to clipboard!
   ```

**Pros**: Works on all terminals, zero dependencies, simple to understand

### Phase 2 (Add Automation): tmux Auto-Spawn

**Automatic spawning for power users**:

1. Auto-detect tmux availability: `which tmux`
2. Auto-detect if in tmux: `$TMUX` env var
3. Offer tmux auto-spawn as **Option A** (recommended)
4. Offer copy-to-clipboard as **Option B** (universal)

**User experience**:
```
⚠️  Another ralph loop is running (feature-a)

Choose how to run feature-b:
A) Auto-spawn in new tmux window (instant, no paste needed)
B) Copy command to paste in new terminal

Your choice (A/B): _
```

With config option `auto_spawn_strategy: "always"` → skip prompt, auto-spawn

### Phase 3 (If Needed): Upstream Ralph Fix

**Long-term ideal solution**:

- Propose `--state-file` parameter to ralph-wiggum
- Allows specifying custom state file location
- Would benefit entire Claude Code community
- Low priority (Phases 1+2 solve the problem)

---

## Implementation Plan

### Phase 1: Auto-Copy + Launch Scripts (Immediate)

**1. Add conflict detection to start.md**

```markdown
## Before running ralph setup:

1. Check if .claude/ralph-loop.local.md exists:
   if [ -f .claude/ralph-loop.local.md ]; then
     CONFLICT=true
     CURRENT_FEATURE=$(grep "feature_name" .claude/ralph-loop.local.md)
   fi

2. If conflict detected:
   - Create launch script
   - Copy to clipboard
   - Show instructions
   - Exit (don't start ralph in current session)
```

**2. Create launch script**

```bash
# In start.md, after worktree creation:

cat > ${worktree_path}/start-claude.sh <<'EOF'
#!/bin/bash
cd "$(dirname "$0")"
exec claude --plugin-dir ~/worktree-manager/plugin
EOF

chmod +x ${worktree_path}/start-claude.sh
```

**3. Copy to clipboard**

```bash
# macOS:
echo "${worktree_path}/start-claude.sh" | pbcopy

# Linux (if xclip available):
echo "${worktree_path}/start-claude.sh" | xclip -selection clipboard
```

**4. User-friendly output**

```markdown
⚠️  Another ralph loop is running (${current_feature})

To run ${new_feature} in parallel without conflicts:

1. Open a new terminal
2. Paste this command:
   ${worktree_path}/start-claude.sh

📋 Command copied to clipboard!

Or continue here to REPLACE the current loop (${current_feature} will stop).

Your choice:
A) I'll paste in new terminal (recommended for parallel work)
B) Replace current loop with ${new_feature}
C) Cancel
```

### Phase 2: tmux Auto-Spawn (After Phase 1 ships)

**1. Add tmux detection**

```bash
# Detect tmux availability
HAS_TMUX=false
if command -v tmux >/dev/null 2>&1; then
  HAS_TMUX=true
fi

# Detect if in tmux session
IN_TMUX=false
if [ -n "$TMUX" ]; then
  IN_TMUX=true
fi
```

**2. Enhanced conflict handling**

```markdown
If HAS_TMUX and IN_TMUX:
  Show Option A: Auto-spawn in new tmux window (instant)
  Show Option B: Copy command to paste
  Show Option C: Replace current loop

If HAS_TMUX and NOT IN_TMUX:
  Show Option A: Auto-spawn in tmux session (background)
  Show Option B: Copy command to paste
  Show Option C: Replace current loop
  💡 Tip: Run 'tmux new -s work' before Claude for instant window spawning

If NOT HAS_TMUX:
  Show Option A: Copy command to paste
  Show Option B: Replace current loop
  💡 Tip: Install tmux for auto-spawning: brew install tmux
```

**3. Implement auto-spawn logic**

```bash
# If user chooses Option A (auto-spawn):

if [ "$IN_TMUX" = true ]; then
  # Already in tmux - spawn new window
  tmux new-window -c ${worktree_path} -n ${feature_name} \
    "${worktree_path}/start-claude.sh"

  echo "✅ Spawned ${feature_name} in new tmux window"
  echo "   Press Ctrl+b n to switch to it"

else
  # Not in tmux - spawn detached session
  tmux new-session -d -s ${feature_name} -c ${worktree_path} \
    "${worktree_path}/start-claude.sh"

  echo "✅ Started ${feature_name} in tmux session"
  echo "   To see it: tmux attach -t ${feature_name}"
  echo "📋 Copied to clipboard!"
  echo "tmux attach -t ${feature_name}" | pbcopy
fi
```

**4. Add config option**

```yaml
# .claude/worktree-manager.local.md
---
# Auto-spawn behavior: "ask" | "always" | "never"
auto_spawn_strategy: "ask"

# If "always" and tmux available:
#   - Skip prompt, auto-spawn immediately
# If "never":
#   - Always use copy-to-clipboard, never auto-spawn
# If "ask" (default):
#   - Prompt user with options
---
```

### Phase 3: FAQ and Documentation

**1. Add FAQ entries** ✅ (done)

- Why parallel loops interfere
- How to run from worktree directory
- Can I run multiple ralph loops in parallel?
- How does tmux auto-spawn work?

**2. Update README**

Add "Using tmux for Parallel Workflows" section with:
- Quick tmux primer (start, switch windows, detach)
- Benefits of auto-spawn
- Configuration options

**3. Update index.html**

Add parallel workflow section to FAQ

---

## Success Criteria

**Solution is successful if:**

1. Users understand the limitation (FAQ + docs) ✅
2. Users know the workaround (run from worktree dir) ✅
3. Users get proactive guidance when starting ralph workflows
4. Advanced users can automate with helper script (optional)
5. Zero cross-contamination between parallel worktrees

**Metrics**:
- User reports of "ralph is doing the wrong thing" drop to zero
- Users successfully run 2+ parallel ralph loops
- Users don't need to ask "how do I do parallel work?"

---

## Open Questions

### Q1: Should we block parallel ralph from the same directory?

**Possible**: Detect existing `.claude/ralph-loop.local.md` and refuse to start a second loop

**Pros**: Prevents mistakes
**Cons**: Reduces flexibility (user might want to replace running loop)

**Decision**: No - warn but don't block. Let users decide.

### Q2: Should we auto-detect "I'm in a worktree" vs "I'm in main repo"?

**Possible**: Check if `$PWD` contains `/worktrees/`

**Use case**:
- If in worktree → safe to run ralph directly
- If in main repo → warn about parallel issues

**Decision**: Yes, implement this as smart detection

### Q3: Should the plugin auto-open a new terminal tab?

**Challenge**: Terminal automation is OS/terminal-specific

**Options**:
- macOS Terminal: `osascript` can open new tabs
- iTerm2: Specific AppleScript API
- Linux: Varies by terminal emulator
- Windows: Varies by terminal

**Decision**: Too complex, too many edge cases. Stick with instructions.

---

## Related Issues

- [Ralph-wiggum design decision](https://github.com/anthropics/claude-code/issues/XXX) - Why state file is session-based
- [MCP tool context](https://github.com/anthropics/claude-code/issues/XXX) - Why tools can't change cwd

---

## Conclusion

The parallel worktree limitation is a **known architectural constraint** of how ralph-wiggum works (session-based state file), but we have **excellent solutions** that make parallel workflows seamless.

**Comprehensive Solution (3-Phase Approach)**:

### ✅ Phase 1: Universal (Works Everywhere)
- Auto-detect conflicts
- Create launch scripts in each worktree
- Copy commands to clipboard
- User pastes in new terminal → instant isolated session
- **Zero dependencies, works on all terminals**

### 🚀 Phase 2: Automation (For Power Users)
- Auto-detect tmux availability
- Offer auto-spawn as Option A when available
- User never needs to learn tmux commands
- Seamless parallel workflows with one keypress to switch
- **Fully automatic with smart fallbacks**

### 💡 Phase 3: Upstream (Long-term Ideal)
- Propose `--state-file` parameter to ralph-wiggum
- Would solve at the root cause
- Benefits entire community
- **Low priority** (Phases 1+2 fully solve the problem)

**User Experience Outcomes**:

**Without tmux** (Phase 1):
```
/worktree-manager:start feature-b implement-only spec.md
→ ⚠️ Conflict detected
→ 📋 ~/worktrees/feature-b/start-claude.sh copied to clipboard
→ User pastes in new terminal → Done!
```

**With tmux** (Phase 2):
```
/worktree-manager:start feature-b implement-only spec.md
→ ⚠️ Conflict detected
→ Choose: A) Auto-spawn (instant) B) Copy command
→ User chooses A
→ ✅ Spawned in new window. Press Ctrl+b n
→ Completely seamless!
```

**Key Insight**: By combining smart detection + launch scripts + tmux automation, we achieve **true parallel workflows** without requiring users to understand the underlying complexity.

Users get:
- ✅ Simple paste workflow (universal)
- ✅ Fully automatic option (tmux users)
- ✅ Clear instructions (discoverable)
- ✅ Zero cross-contamination (isolated sessions)
- ✅ Unlimited parallel features (scale to 10+ worktrees)
