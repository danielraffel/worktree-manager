# Multi-Ecosystem Detection: Analysis & Recommendation

## Problem Statement

When creating a new worktree, the plugin auto-detects project type and immediately runs setup. Current behavior:
- Scans in priority order, stops at first match
- Immediately runs the command (e.g., `npm install`)
- Can disable via `auto_run_setup: false` but it's on by default

**The problem:** Multi-ecosystem repos. A repo with both `package.json` and `Cargo.toml` detects Node.js first and runs a 5-minute npm install when you actually wanted Rust.

## Options Considered

### Option 1: Keep Current (Auto-detect first, auto-run)
**Pros:**
- Zero friction for 90%+ of repos (single-ecosystem)
- Matches user expectations from similar tools
- Already works, no code changes needed

**Cons:**
- Wrong choice in multi-ecosystem repos wastes significant time
- No recovery path once install starts
- User has to remember `auto_run_setup: false` config exists

**Verdict:** Good default for single-ecosystem repos, painful for polyglot devs.

### Option 2: Detect first, then prompt
**Pros:**
- One keystroke (Y/Enter) for happy path
- "Scan for others" provides escape hatch
- User sees what's about to happen before it runs

**Cons:**
- Adds friction to every worktree creation
- Two-step flow if scanning for others
- Still does priority-based detection initially

**Verdict:** Reasonable compromise, but the "scan for others" branch feels bolted on.

### Option 3: Scan on demand (quick/full/skip)
**Pros:**
- User controls thoroughness explicitly
- Full scan available when needed

**Cons:**
- Three choices before anything happens = analysis paralysis
- "quick" vs "full" distinction is implementation detail, not user intent
- Highest cognitive load of all options

**Verdict:** Over-engineered. Users don't think in terms of scan strategies.

### Option 4: Ask after creation (freeform input)
**Pros:**
- Maximum flexibility
- No detection logic complexity
- User types exactly what they want

**Cons:**
- Loses the value of auto-detection entirely
- User must remember/type exact commands
- No discoverability of what's available

**Verdict:** Too much friction, throws away detection work.

## Recommendation: Parallel Detection + Single Prompt

**Hybrid approach combining best of options:**

```
Creating worktree at ~/worktrees/my-feature...
Detected: Node.js (npm), Rust (cargo), Swift PM
Run setup? [1=npm | 2=cargo | 3=swift | a=all | n=skip]:
```

### How it works:
1. Scan ALL ecosystems in parallel (fast—just file existence checks)
2. Show everything found in one line
3. Single prompt with numbered choices

### Why this works:
- Detection is cheap (just `fs.existsSync` calls, no I/O)
- User sees full picture before committing
- Single keystroke for most cases (hit 1 or Enter for first)
- Supports `a` for "run all" in intentional polyglot repos
- `n` or Enter-to-skip for "I'll handle it myself"

### Behavior by scenario:
- **Single ecosystem found:** `Detected: Node.js (npm). Run setup? [Y/n]`
- **Multiple found:** Numbered list as shown above
- **None found:** `No project types detected. Worktree ready.`

### Configuration:
```yaml
auto_run_setup: true    # Current behavior (auto-run first detected)
auto_run_setup: prompt  # NEW DEFAULT - detect all, then prompt
auto_run_setup: false   # Skip detection entirely
```

## Implementation Complexity

This is actually simpler than current code because:
1. No priority logic needed—just scan everything
2. Single code path for prompting
3. Detection can be parallelized trivially

The detection phase (checking for lockfiles/manifests) should take <100ms even for all 18 ecosystems since it's just file existence checks.

## The Core Tradeoff

The 5-minute npm install when you wanted Rust is a bad enough experience that one keystroke of prevention is worth it. Users creating worktrees are already in "setup mode" mentally—they expect some interaction.

**Summary:** Parallel-detect-then-prompt. One prompt, full visibility, single keystroke happy path. The cost is one extra interaction per worktree; the benefit is never wasting 5 minutes on the wrong install.
