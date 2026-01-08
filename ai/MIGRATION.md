# Migration Guide: Worktree Manager v2 → v3

## What Changed?

Worktree Manager v3 focuses exclusively on git worktree operations. All workflow automation features (plan-only, implement-only, plan-and-implement) have been moved to the new **Chainer** plugin.

## Why the Change?

- **Single Responsibility**: Each plugin does one thing well
- **Flexibility**: Chainer can orchestrate ANY plugins, not just feature-dev + ralph-wiggum
- **Reusability**: Chainer works standalone or with Worktree Manager
- **Maintainability**: Simpler codebases, easier to extend

## Quick Migration

### Before (v2)
```bash
/worktree-manager:start oauth plan-and-implement "Build OAuth"
```

### After (v3)
```bash
# Option 1: Two commands
/worktree-manager:start oauth
/chainer:run plan-and-implement \
  --cwd="~/worktrees/oauth" \
  --prompt="Build OAuth" \
  --feature_name="oauth"

# Option 2: One command (Chainer creates worktree)
/chainer:run worktree-plan-implement \
  --feature_name="oauth" \
  --prompt="Build OAuth"
```

## Detailed Migration

### Simple Workflow (No Change)

```bash
# v2 and v3 - identical
/worktree-manager:start my-feature
```

✅ **No migration needed** - simple workflow works the same.

### Plan-Only Workflow

**Before (v2):**
```bash
/worktree-manager:start oauth plan-only "Build OAuth authentication"
```

**After (v3):**
```bash
# Create worktree
/worktree-manager:start oauth

# Run planning in worktree
/chainer:run plan-only \
  --cwd="~/worktrees/oauth" \
  --prompt="Build OAuth authentication" \
  --feature_name="oauth"
```

### Implement-Only Workflow

**Before (v2):**
```bash
/worktree-manager:start oauth implement-only audit/oauth.md
```

**After (v3):**
```bash
# Create worktree
/worktree-manager:start oauth

# Run implementation in worktree
/chainer:run implement-only \
  --cwd="~/worktrees/oauth" \
  --spec_file="audit/oauth.md"
```

### Plan-and-Implement Workflow

**Before (v2):**
```bash
/worktree-manager:start oauth plan-and-implement "Build OAuth"
```

**After (v3):**
```bash
# Option 1: Separate commands
/worktree-manager:start oauth
/chainer:run plan-and-implement \
  --cwd="~/worktrees/oauth" \
  --prompt="Build OAuth" \
  --feature_name="oauth"

# Option 2: Single command (recommended)
/chainer:run worktree-plan-implement \
  --feature_name="oauth" \
  --prompt="Build OAuth"
```

## Configuration Changes

Your existing `~/.claude/worktree-manager.local.md` configuration **still works**:

```yaml
---
worktree_base_path: ~/my-worktrees
branch_prefix: feat/
create_learnings_file: true
---
```

**No changes needed** to your configuration.

The following config options are no longer used (they were for workflows):
- `default_workflow` - Now always "simple"
- `spec_directory` - Moved to Chainer config
- `default_max_iterations` - Moved to Chainer config

You can remove these, but leaving them won't cause any issues.

## New Chainer Configuration

Create `~/.claude/chainer.local.md` to customize workflow chains:

```yaml
---
chains:
  plan-and-implement:
    enabled: true
    description: "Plan with feature-dev, implement with ralph-wiggum"
    inputs:
      prompt: { required: true }
      feature_name: { required: true }
    steps:
      - name: plan
        type: skill
        skill: feature-dev:feature-dev
        args: "{{prompt}}"
      - name: implement
        type: script
        script: |
          SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)"
          bash "$SCRIPT_PATH" "Implement features from audit/{{feature_name}}.md" --max-iterations 50 --completion-promise DONE

defaults:
  spec_directory: audit
  max_iterations: 50
---
```

## Installation

### Install Chainer

```bash
git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer
```

### Update Worktree Manager

```bash
cd ~/.claude/plugins/worktree-manager
git pull origin main
cd mcp-server
npm install
npm run build
```

## Benefits of the Split

### 1. Use Worktree Manager Standalone

```bash
# Just create worktrees, no automation
/worktree-manager:start feature-a
/worktree-manager:start feature-b
/worktree-manager:start feature-c
```

### 2. Use Chainer for Any Plugins

```bash
# Chainer isn't limited to worktree-manager
/chainer:run plan-and-implement \
  --prompt="Build feature" \
  --feature_name="feature"

# Works in current directory, no worktree needed
```

### 3. Create Custom Workflows

```yaml
# In ~/.claude/chainer.local.md
design-and-build:
  enabled: true
  description: "Design UI, then build"
  steps:
    - name: design
      type: skill
      skill: frontend-design:frontend-design
      args: "{{prompt}}"
    - name: build
      type: skill
      skill: ralph-wiggum:ralph-loop
```

### 4. Mix and Match

```bash
# Use worktree-manager for isolation
/worktree-manager:start payments

# Use Chainer for automation
/chainer:run design-and-build \
  --cwd="~/worktrees/payments" \
  --prompt="Stripe checkout"

# Use both together
/chainer:run worktree-plan-implement \
  --feature_name="subscriptions" \
  --prompt="Recurring billing"
```

## Troubleshooting

### "Chain not found" Error

**Problem:** `/chainer:run plan-and-implement` returns "chain not found"

**Solution:** Chainer not installed. Install it:
```bash
git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer
```

### "Workflow not supported" Error

**Problem:** `/worktree-manager:start oauth plan-and-implement "..."` returns error

**Solution:** v3 doesn't support workflow parameters. Use Chainer instead:
```bash
/chainer:run worktree-plan-implement --feature_name="oauth" --prompt="..."
```

### Missing spec_directory

**Problem:** Specs not saving to the right location

**Solution:** Configure `spec_directory` in Chainer config:
```yaml
# ~/.claude/chainer.local.md
---
defaults:
  spec_directory: audit
---
```

## FAQ

**Q: Do I have to use Chainer?**

A: No! If you only use `/worktree-manager:start <name>` (simple workflow), nothing changes. Chainer is only needed for automated workflows.

**Q: Can I still use feature-dev and ralph-wiggum directly?**

A: Yes! You can call them directly:
```bash
/worktree-manager:start oauth
cd ~/worktrees/oauth
/feature-dev:feature-dev "Build OAuth"
/ralph-wiggum:ralph-loop
```

**Q: Will my old commands break?**

A: The simple workflow (`/worktree-manager:start <name>`) works exactly the same. Only workflow-specific commands (plan-only, implement-only, etc.) need updating.

**Q: Why not keep both options?**

A: Maintaining workflow logic in two places (Worktree Manager and Chainer) would lead to bugs and confusion. The split makes each tool simpler and more maintainable.

## Summary

| Feature | v2 | v3 |
|---------|----|----|
| Create worktree | ✅ `/worktree-manager:start` | ✅ `/worktree-manager:start` |
| Auto-setup | ✅ Automatic | ✅ Automatic |
| Plan-only workflow | ✅ Built-in | ✅ Via Chainer |
| Implement-only workflow | ✅ Built-in | ✅ Via Chainer |
| Plan-and-implement workflow | ✅ Built-in | ✅ Via Chainer |
| Custom workflows | ❌ Not supported | ✅ Via Chainer config |
| Works with other plugins | ❌ Only feature-dev + ralph | ✅ Any plugins |

## Getting Help

- **Worktree Manager Issues**: https://github.com/danielraffel/worktree-manager/issues
- **Chainer Issues**: https://github.com/danielraffel/Chainer/issues
- **Documentation**: See README.md in each repository

## Feedback

Found this migration guide helpful? Have suggestions? Open an issue on GitHub!
