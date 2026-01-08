# Parallel Workflow Implementation - Final Proposal

**Status**: Ready to Implement
**Created**: 2025-12-31
**Approved**: Yes

---

## Executive Summary

Implement smart conflict detection + automatic parallel workflow support with zero user friction.

**What it does**:
- Detects when user tries to start a second ralph loop
- Automatically creates isolated sessions (via tmux if available)
- Falls back to simple copy-paste command if tmux not available
- User never needs to understand the underlying complexity

**User impact**:
- ✅ Works everywhere (universal fallback)
- ✅ Fully automatic for tmux users
- ✅ One paste for non-tmux users
- ✅ Configurable (auto-spawn always/never/ask)
- ✅ Clear, educational messaging

---

## Implementation Phases

### Phase 1: Universal Fallback (Ship First)

**Conflict detection + launch scripts + clipboard**

**When**: Immediate (v1.0)
**Dependencies**: None
**Risk**: Low

**Features**:
1. Detect existing `.claude/ralph-loop.local.md`
2. Create `start-claude.sh` in worktree
3. Copy command to clipboard
4. Show clear instructions

**User experience**:
```
/worktree-manager:start feature-b implement-only spec.md

⚠️  Another ralph loop is running (feature-a)

To run feature-b in parallel:
  ~/worktrees/feature-b/start-claude.sh

📋 Copied to clipboard! Paste in a new terminal.
```

**Implementation**: Update `plugin/commands/start.md` only

### Phase 2: tmux Auto-Spawn (Add Automation)

**Automatic session spawning with smart detection**

**When**: After Phase 1 ships and is stable (v1.1)
**Dependencies**: tmux (optional, auto-detected)
**Risk**: Medium (tmux edge cases)

**Features**:
1. Detect tmux availability (`which tmux`)
2. Detect if in tmux session (`$TMUX`)
3. Offer auto-spawn as Option A
4. Smart fallbacks for all scenarios

**User experience (with tmux)**:
```
/worktree-manager:start feature-b implement-only spec.md

⚠️  Another ralph loop is running (feature-a)

Choose how to run feature-b:
A) Auto-spawn in tmux session (automatic, recommended)
B) Copy command to paste in new terminal

Your choice (A/B): A

✅ Started feature-b in tmux session
   To see it: tmux attach -t feature-b

📋 Command copied to clipboard!
```

**With auto-spawn config**:
```yaml
# .claude/worktree-manager.local.md
---
auto_spawn_strategy: "always"
---

# Now it just auto-spawns without asking:
/worktree-manager:start feature-b implement-only spec.md
→ ⚠️ Conflict detected. Auto-spawning feature-b...
→ ✅ Done! tmux attach -t feature-b
```

**Implementation**: Update `plugin/commands/start.md` with tmux logic

---

## Technical Implementation

### Phase 1: Conflict Detection & Launch Scripts

**Location**: `plugin/commands/start.md`

**Add before running ralph setup**:

```markdown
## Step 2.5: Check for conflicts (NEW)

Before running ralph setup in implement-only or plan-and-implement workflows:

1. Check if `.claude/ralph-loop.local.md` exists:
   ```bash
   if [ -f .claude/ralph-loop.local.md ]; then
     CONFLICT_DETECTED=true
     CURRENT_FEATURE=$(grep -A 10 "^---" .claude/ralph-loop.local.md | grep "Work ONLY in" | sed 's/.*\/worktrees\/\([^/]*\).*/\1/' || echo "unknown")
   fi
   ```

2. If conflict detected, create launch script instead of running ralph:
   ```bash
   # Create launcher script
   cat > ${WORKTREE_PATH}/start-claude.sh <<'EOF'
#!/bin/bash
cd "$(dirname "$0")"
exec claude --plugin-dir ~/worktree-manager/plugin
EOF

   chmod +x ${WORKTREE_PATH}/start-claude.sh

   # Copy to clipboard (macOS)
   echo "${WORKTREE_PATH}/start-claude.sh" | pbcopy 2>/dev/null || true

   # Show instructions
   echo ""
   echo "⚠️  Another ralph loop is running (${CURRENT_FEATURE})"
   echo ""
   echo "To run ${FEATURE_NAME} in parallel without conflicts:"
   echo ""
   echo "  1. Open a new terminal"
   echo "  2. Paste this command:"
   echo ""
   echo "     ${WORKTREE_PATH}/start-claude.sh"
   echo ""
   echo "📋 Command copied to clipboard!"
   echo ""
   echo "Or continue here to REPLACE the current loop (${CURRENT_FEATURE} will stop)."
   echo ""

   # Exit without running ralph in current session
   exit 0
   ```

3. User pastes command in new terminal → Claude starts in worktree → isolated session
```

### Phase 2: tmux Auto-Spawn

**Location**: `plugin/commands/start.md` (extend Phase 1)

**Add tmux detection**:

```markdown
## Step 2.5: Check for conflicts (ENHANCED)

1. Check for conflict (same as Phase 1)

2. If conflict detected, check tmux availability:
   ```bash
   # Detect tmux
   HAS_TMUX=false
   if command -v tmux >/dev/null 2>&1; then
     HAS_TMUX=true
   fi

   # Check if in tmux session
   IN_TMUX=false
   if [ -n "$TMUX" ]; then
     IN_TMUX=true
   fi

   # Read config for auto-spawn strategy
   AUTO_SPAWN_STRATEGY="ask"
   if [ -f .claude/worktree-manager.local.md ]; then
     AUTO_SPAWN_STRATEGY=$(grep "^auto_spawn_strategy:" .claude/worktree-manager.local.md | cut -d: -f2 | tr -d ' "' || echo "ask")
   fi
   ```

3. Create launch script (same as Phase 1)

4. Offer options based on tmux availability:
   ```bash
   if [ "$AUTO_SPAWN_STRATEGY" = "never" ]; then
     # Skip to copy-to-clipboard
     show_copy_instructions
     exit 0
   fi

   if [ "$HAS_TMUX" = true ] && [ "$AUTO_SPAWN_STRATEGY" = "always" ]; then
     # Auto-spawn without asking
     auto_spawn_tmux
     exit 0
   fi

   # Show interactive options
   echo ""
   echo "⚠️  Another ralph loop is running (${CURRENT_FEATURE})"
   echo ""
   echo "Choose how to run ${FEATURE_NAME}:"
   echo ""

   if [ "$IN_TMUX" = true ]; then
     echo "  A) Auto-spawn in new tmux window (instant, recommended)"
     echo "  B) Copy command to paste in new terminal"
     echo ""
     read -p "Your choice (A/B): " CHOICE

     if [ "$CHOICE" = "A" ] || [ "$CHOICE" = "a" ]; then
       # Spawn new window in current session
       tmux new-window -c "${WORKTREE_PATH}" -n "${FEATURE_NAME}" \
         "${WORKTREE_PATH}/start-claude.sh"

       echo ""
       echo "✅ Spawned ${FEATURE_NAME} in new tmux window"
       echo "   Press Ctrl+b n to switch to it"
       echo ""
       exit 0
     fi

   elif [ "$HAS_TMUX" = true ]; then
     echo "  A) Auto-spawn in tmux session (automatic, recommended)"
     echo "  B) Copy command to paste in new terminal"
     echo ""
     echo "💡 Tip: Run 'tmux new -s work' before Claude for instant window spawning"
     echo ""
     read -p "Your choice (A/B): " CHOICE

     if [ "$CHOICE" = "A" ] || [ "$CHOICE" = "a" ]; then
       # Spawn detached session
       tmux new-session -d -s "${FEATURE_NAME}" -c "${WORKTREE_PATH}" \
         "${WORKTREE_PATH}/start-claude.sh"

       ATTACH_CMD="tmux attach -t ${FEATURE_NAME}"
       echo "$ATTACH_CMD" | pbcopy 2>/dev/null || true

       echo ""
       echo "✅ Started ${FEATURE_NAME} in tmux session"
       echo "   To see it, run:"
       echo ""
       echo "     ${ATTACH_CMD}"
       echo ""
       echo "📋 Command copied to clipboard!"
       echo ""
       exit 0
     fi

   else
     echo "  A) Copy command to paste in new terminal"
     echo ""
     echo "💡 Tip: Install tmux for automatic spawning: brew install tmux"
     echo ""
     read -p "Press Enter to continue..."
   fi

   # Option B or no tmux: show copy instructions
   show_copy_instructions
   exit 0
   ```
```

---

## Configuration

Add new config option to support auto-spawn behavior:

**Location**: `mcp-server/src/utils/config-reader.ts` (if MCP handles config)
Or document in README for manual `.claude/worktree-manager.local.md` creation

**New option**:
```yaml
---
# Auto-spawn strategy when conflict detected
# Options: "ask" | "always" | "never"
# - ask (default): Prompt user with options
# - always: Auto-spawn tmux if available, skip prompt
# - never: Always use copy-to-clipboard, never auto-spawn
auto_spawn_strategy: "ask"
---
```

**Config file locations**:
- Project: `.claude/worktree-manager.local.md` (overrides global)
- Global: `~/.claude/worktree-manager.local.md`

---

## Documentation Changes

### 1. `/Users/danielraffel/Code/worktree-manager/README.md`

**Add new section after "Quick Start"**:

```markdown
## Parallel Workflows

Worktree Manager detects when you try to start multiple ralph loops and handles isolation automatically.

### Automatic (with tmux)

If you have tmux installed, parallel workflows are fully automatic:

```bash
# Start tmux once:
tmux new -s work

# Create first worktree:
/worktree-manager:start feature-a implement-only spec-a.md
✅ Working on feature-a

# Create second worktree (automatic parallel session):
/worktree-manager:start feature-b implement-only spec-b.md
⚠️  Conflict detected
Choose: A) Auto-spawn (instant) B) Copy command
→ Pick A
✅ Spawned in new window. Press Ctrl+b n
```

**Switch between features**:
- `Ctrl+b n` - next window
- `Ctrl+b p` - previous window
- `Ctrl+b w` - list all windows

### Manual (without tmux)

Without tmux, you'll get a ready-to-paste command:

```bash
/worktree-manager:start feature-b implement-only spec-b.md
⚠️  Conflict detected

To run feature-b in parallel:
  ~/worktrees/feature-b/start-claude.sh

📋 Copied to clipboard! Paste in new terminal.
```

### tmux Setup (One-time)

**macOS**:
```bash
brew install tmux
```

**Linux**:
```bash
sudo apt install tmux  # Ubuntu/Debian
```

No configuration needed - the plugin detects and uses tmux automatically.

### Skip the Prompt (Advanced)

Auto-spawn without asking:

```yaml
# .claude/worktree-manager.local.md
---
auto_spawn_strategy: "always"
---
```

Never auto-spawn:
```yaml
---
auto_spawn_strategy: "never"
---
```
```

**Update existing "Configuration" section**:

Add `auto_spawn_strategy` to the options table:

```markdown
| `auto_spawn_strategy` | `ask` | Conflict handling: `ask`, `always`, `never` |
```

### 2. `/Users/danielraffel/Code/worktree-manager/index.html`

**Update existing FAQ "Can I run multiple ralph-wiggum loops in parallel worktrees?"**:

Replace current answer with:

```html
<div class="faq-answer">
    <p><strong>Yes! Worktree Manager handles this automatically.</strong></p>

    <p><strong>With tmux (automatic)</strong>:</p>
    <p>Start tmux once: <code>tmux new -s work</code></p>
    <p>Then create multiple worktrees normally. When a conflict is detected, the plugin offers to auto-spawn in a new tmux window. Press <code>Ctrl+b n</code> to switch between features.</p>

    <p><strong>Without tmux (simple paste)</strong>:</p>
    <p>The plugin creates a launcher script and copies it to your clipboard. Just paste in a new terminal and you're running in parallel.</p>

    <p><strong>Install tmux (optional)</strong>:</p>
    <p><code>brew install tmux</code> (macOS) or <code>sudo apt install tmux</code> (Linux)</p>

    <p>No tmux knowledge required - the plugin handles everything!</p>
</div>
```

**Add new FAQ**:

```html
<div class="faq-item">
    <div class="faq-question" onclick="toggleFaq(this)">Why does it ask me how to run the second worktree?</div>
    <div class="faq-answer">
        <p>When you try to start a second ralph-wiggum loop while one is already running, both would normally interfere with each other (they'd share the same state file).</p>

        <p>The plugin detects this conflict and gives you options:</p>
        <p><strong>Option A (automatic)</strong>: If you have tmux, it can spawn an isolated session automatically. No manual steps, just pick A and it's done.</p>
        <p><strong>Option B (manual)</strong>: Copy a command to paste in a new terminal. Works everywhere, no dependencies.</p>

        <p><strong>Don't want to choose every time?</strong> Set <code>auto_spawn_strategy: "always"</code> in your config to auto-spawn without asking.</p>

        <p>This ensures each worktree runs in complete isolation with zero cross-contamination.</p>
    </div>
</div>
```

**Update Configuration section**:

Add `auto_spawn_strategy` to the config example and table:

```html
<span class="code-comment"># Conflict handling when multiple ralph loops detected</span>
auto_spawn_strategy: ask  # ask | always | never
```

And in the table:

```html
<tr>
    <td><code>auto_spawn_strategy</code></td>
    <td><code>ask</code></td>
    <td>How to handle parallel ralph loops: <code>ask</code> (prompt user), <code>always</code> (auto-spawn tmux), <code>never</code> (always copy command)</td>
</tr>
```

### 3. `/Users/danielraffel/Code/worktree-manager/plugin/README.md`

**Add section after "Usage Examples"**:

```markdown
## Parallel Workflows

Worktree Manager automatically handles running multiple ralph loops in parallel.

### With tmux (Automatic)

**One-time setup**:
```bash
brew install tmux  # macOS
sudo apt install tmux  # Linux
```

**Usage**:
```bash
# Start tmux:
tmux new -s work

# In Claude:
/worktree-manager:start feature-a implement-only spec-a.md
# ✅ Works normally

/worktree-manager:start feature-b implement-only spec-b.md
# ⚠️ Conflict detected
# Choose: A) Auto-spawn B) Copy command
# Pick A → Instant new window

# Switch between them:
Ctrl+b n  # next window
Ctrl+b p  # previous window
```

### Without tmux (Copy & Paste)

No tmux? No problem:

```bash
/worktree-manager:start feature-b implement-only spec-b.md
# ⚠️ Conflict detected
#
# To run feature-b in parallel:
#   ~/worktrees/feature-b/start-claude.sh
#
# 📋 Copied to clipboard!

# Open new terminal, paste, done!
```

### Configuration

Auto-spawn without asking:

```yaml
# .claude/worktree-manager.local.md
---
auto_spawn_strategy: "always"
---
```

Never auto-spawn:
```yaml
---
auto_spawn_strategy: "never"
---
```
```

**Update Configuration section**:

Add to the options table:

```markdown
| `auto_spawn_strategy` | `ask` | Conflict handling: `ask` (prompt), `always` (auto-spawn), `never` (copy only) |
```

---

## FAQ Additions

### Q: Why does it ask me to choose when starting a second worktree?

**A**: When you try to start a second ralph-wiggum loop while one is already running, they would normally conflict (share the same state file). The plugin detects this and offers you safe options:

- **Option A (if tmux available)**: Auto-spawn in isolated session - completely automatic, zero manual steps
- **Option B**: Copy command to paste in new terminal - works everywhere

You can set `auto_spawn_strategy: "always"` in your config to skip the prompt and auto-spawn every time.

### Q: Do I need to learn tmux?

**A**: Nope! The plugin handles all tmux commands automatically. You only need to know:
- Start tmux: `tmux new -s work` (do this once)
- Switch windows: `Ctrl+b n` (next) or `Ctrl+b p` (previous)
- That's it!

If you don't want to use tmux at all, the simple copy-paste workflow works great.

### Q: What if I don't have tmux?

**A**: No problem! The plugin falls back to copy-to-clipboard. You'll get a command like `~/worktrees/feature-b/start-claude.sh` that's already copied - just paste it in a new terminal and you're running in parallel.

Want automatic spawning? Install tmux once: `brew install tmux` (macOS) or `sudo apt install tmux` (Linux).

### Q: Can I run more than 2 parallel worktrees?

**A**: Absolutely! Run as many as you want. Each gets its own isolated session. With tmux, you can have 10+ features running simultaneously, each in its own window.

### Q: What happens if I pick "Replace current loop"?

**A**: The current ralph loop (feature-a) will stop, and the new loop (feature-b) will start in the current session. This is useful if you're done with feature-a and want to switch focus without opening a new terminal.

---

## Implementation Checklist

### Phase 1 (Universal Fallback)

- [ ] Update `plugin/commands/start.md`:
  - [ ] Add conflict detection before ralph setup
  - [ ] Create `start-claude.sh` script in worktree
  - [ ] Copy command to clipboard (macOS: pbcopy)
  - [ ] Show user-friendly instructions
  - [ ] Exit without running ralph if conflict detected
- [ ] Test on macOS Terminal
- [ ] Test on iTerm2
- [ ] Test on VS Code integrated terminal
- [ ] Update README.md with parallel workflows section
- [ ] Update index.html FAQ
- [ ] Update plugin/README.md with examples
- [ ] Commit and tag as v1.0

### Phase 2 (tmux Auto-Spawn)

- [ ] Update `plugin/commands/start.md`:
  - [ ] Add tmux detection (`which tmux`, `$TMUX`)
  - [ ] Add config reading for `auto_spawn_strategy`
  - [ ] Implement interactive choice (A/B)
  - [ ] Implement auto-spawn for "in tmux" case
  - [ ] Implement auto-spawn for "has tmux" case
  - [ ] Add helpful tips based on tmux availability
- [ ] Add `auto_spawn_strategy` to config system
- [ ] Test in tmux (new window spawning)
- [ ] Test outside tmux (detached session)
- [ ] Test with `auto_spawn_strategy: "always"`
- [ ] Test with `auto_spawn_strategy: "never"`
- [ ] Update docs with tmux instructions
- [ ] Update FAQ with new entries
- [ ] Commit and tag as v1.1

### Documentation Updates

- [ ] README.md: Add "Parallel Workflows" section
- [ ] README.md: Add `auto_spawn_strategy` to config table
- [ ] index.html: Update parallel worktrees FAQ
- [ ] index.html: Add "Why does it ask" FAQ
- [ ] index.html: Add `auto_spawn_strategy` to config
- [ ] plugin/README.md: Add "Parallel Workflows" section
- [ ] plugin/README.md: Add config option

---

## Testing Scenarios

### Scenario 1: No tmux installed

```bash
/worktree-manager:start feature-a implement-only spec-a.md
✅ Works

/worktree-manager:start feature-b implement-only spec-b.md
⚠️  Conflict
→ Shows copy command
→ Clipboard has command
→ Suggests installing tmux

# Expected: User pastes in new terminal, works
```

### Scenario 2: tmux installed, not in session

```bash
/worktree-manager:start feature-a implement-only spec-a.md
✅ Works

/worktree-manager:start feature-b implement-only spec-b.md
⚠️  Conflict
→ Option A: Auto-spawn in tmux
→ Option B: Copy command
→ Pick A
→ Spawns detached session
→ Shows "tmux attach -t feature-b"
→ Clipboard has attach command

# Expected: User runs attach command, in isolated session
```

### Scenario 3: Already in tmux

```bash
tmux new -s work

/worktree-manager:start feature-a implement-only spec-a.md
✅ Works

/worktree-manager:start feature-b implement-only spec-b.md
⚠️  Conflict
→ Option A: Auto-spawn in new window
→ Option B: Copy command
→ Pick A
→ NEW WINDOW APPEARS INSTANTLY
→ Shows "Press Ctrl+b n"

# Expected: Ctrl+b n switches to new window with feature-b running
```

### Scenario 4: Auto-spawn always

```yaml
# Config:
auto_spawn_strategy: "always"
```

```bash
/worktree-manager:start feature-a implement-only spec-a.md
✅ Works

/worktree-manager:start feature-b implement-only spec-b.md
⚠️  Conflict detected. Auto-spawning feature-b...
✅ Done! tmux attach -t feature-b

# Expected: No prompt, immediate spawn
```

### Scenario 5: Multiple parallel features

```bash
tmux new -s work

/worktree-manager:start feature-a implement-only spec-a.md
/worktree-manager:start feature-b implement-only spec-b.md
/worktree-manager:start feature-c implement-only spec-c.md
/worktree-manager:start feature-d implement-only spec-d.md

# Expected: 4 tmux windows, all isolated, Ctrl+b w to list them
```

---

## Success Metrics

**Phase 1 Success**:
- ✅ Zero conflicts between parallel worktrees
- ✅ Works on all terminals without tmux
- ✅ Clear, actionable error messages
- ✅ Command copied to clipboard successfully
- ✅ Users report "just worked" experience

**Phase 2 Success**:
- ✅ Auto-spawn works in tmux
- ✅ New windows appear instantly when in tmux
- ✅ Detached sessions work outside tmux
- ✅ Config option skips prompt as expected
- ✅ Users report "felt like magic" experience
- ✅ Zero tmux knowledge required

**Overall Success**:
- ✅ Users can run 5+ parallel worktrees without thinking
- ✅ No reports of cross-contamination
- ✅ Documentation is clear and complete
- ✅ Works on macOS, Linux, different terminals
- ✅ Graceful degradation (tmux → copy/paste)

---

## Risks & Mitigations

### Risk 1: tmux keybinding conflicts in VS Code

**Mitigation**: Document common conflicts, provide copy-paste fallback, make tmux optional

### Risk 2: Clipboard copy fails on some systems

**Mitigation**: Gracefully handle `pbcopy` failure, still show command on screen

### Risk 3: User doesn't understand tmux windows

**Mitigation**: Clear instructions, show exact keys to press, educational tips

### Risk 4: State file corruption if user kills tmux

**Mitigation**: Each worktree has independent state file, no shared state

### Risk 5: Users confused by the prompt

**Mitigation**: Clear, simple language, default to safest option (copy/paste), allow config to skip

---

## Conclusion

This proposal solves the parallel worktree problem comprehensively:

**For all users**: Simple copy-paste workflow (Phase 1)
**For power users**: Full automation with tmux (Phase 2)
**For advanced users**: Configurable behavior

**Why it's good**:
- ✅ Works everywhere (universal fallback)
- ✅ Truly automatic for those who want it
- ✅ No forced behavior (ask by default)
- ✅ Clear, educational messaging
- ✅ Zero user friction once configured
- ✅ Scales to unlimited parallel features

**Implementation is straightforward**:
- Phase 1: ~100 lines in start.md
- Phase 2: ~200 more lines in start.md
- No MCP server changes needed
- Config is optional (works great without it)

**This really does sound too good to be true - but it's all achievable!** 🎉
