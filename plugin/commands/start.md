---
description: Create git worktree with auto-setup and optional automation workflows
argument-hint: "<feature-name> [options]"
allowed-tools:
  - "mcp__worktree__worktree_start"
  - "Read"
  - "Bash"
---

# Worktree Start Command

Create a new git worktree for parallel feature development with automatic environment setup and optional integration with feature-dev and ralph-wiggum plugins.

## Usage

```bash
/worktree-manager:start <feature-name> [workflow] [options]
```

## Workflows

### 1. Simple (default) - Manual development
Creates worktree with auto-setup, ready for manual work.

**Example**:
```
/worktree-manager:start bug-fix
```

### 2. Plan-only - Feature planning
Creates worktree and runs feature-dev to generate specification.

**Example**:
```
/worktree-manager:start password-reset plan-only "Design password reset with email verification"
```

### 3. Implement-only - Automated implementation
Creates worktree and runs ralph with template automation.

**Example**:
```
/worktree-manager:start signin-rebuild implement-only audit/signin-spec.md --work-on="Phase 6" --skip="Phase 7"
```

### 4. Plan-and-implement - Full automation
Creates worktree, plans with feature-dev, then implements with ralph.

**Example**:
```
/worktree-manager:start admin-messaging plan-and-implement "Design admin messaging system" --work-on="P0 items" --skip="P2 items"
```

## Instructions for Claude

When user invokes this command:

1. **Parse the arguments**:
   - feature-name (required): Extract from first argument
   - workflow (optional): simple | plan-only | implement-only | plan-and-implement (default: simple)
   - Additional arguments depend on workflow

2. **For simple workflow**:
   - Call `mcp__worktree__worktree_start` with just `feature_name`
   - Display the result's `setup_messages` and `next_steps` to user
   - If setup failed, explain the error

3. **For plan-only workflow**:
   - Extract planning prompt from arguments
   - Call `mcp__worktree__worktree_start` with:
     - `feature_name`
     - `workflow: "plan-only"`
     - `plan_config: { prompt: "<extracted prompt>" }`
   - Display spec file location and next options (implement manually or with ralph)

4. **For implement-only workflow**:
   - Extract source file path
   - Extract --work-on and --skip flags
   - Call `mcp__worktree__worktree_start` with:
     - `feature_name`
     - `workflow: "implement-only"`
     - `ralph_config: { source_file, work_on, skip_items }`
   - Explain that ralph is running in background

5. **For plan-and-implement workflow**:
   - Extract planning prompt
   - Extract --work-on and --skip flags
   - Call `mcp__worktree__worktree_start` with:
     - `feature_name`
     - `workflow: "plan-and-implement"`
     - `plan_config: { prompt }`
     - `ralph_config: { work_on, skip_items }`
   - Display automation status and monitoring instructions

6. **Error handling**:
   - If tool call fails, show user the error
   - Suggest fixes based on common issues (not in git repo, branch exists, etc.)

7. **Success response**:
   - Always show the worktree path and branch created
   - For automated workflows, explain what's happening in background
   - Provide monitoring commands if applicable

## Tips

- Feature name becomes `feature/<name>` branch
- Worktrees created in `~/snapguide-worktrees/<feature-name>/`
- Web projects get automatic `npm install`
- Background tasks can be monitored with `tail -f /tmp/claude-worktree-*.log`

## Examples

**Quick bug fix**:
```
User: /worktree-manager:start quick-fix
Claude: [Creates worktree, runs setup, shows next steps]
```

**Plan new feature**:
```
User: /worktree-manager:start auth-system plan-only "Design OAuth2 authentication with JWT tokens"
Claude: [Creates worktree, runs feature-dev, saves spec to audit/auth-system.md]
```

**Implement from spec**:
```
User: /worktree-manager:start build-auth implement-only audit/auth-system.md --work-on="P0 items"
Claude: [Creates worktree, runs ralph in background with auto-filled template]
```

**Full automation**:
```
User: /worktree-manager:start comments plan-and-implement "Add comment system with replies and threading" --work-on="P0 features" --skip="P2 features"
Claude: [Creates worktree, plans with feature-dev, implements with ralph, all automated]
```
