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

**CRITICAL: Always use the `mcp__worktree__worktree_start` MCP tool. Never manually run git commands or do the work yourself.**

When user invokes this command:

### 1. Parse the arguments and detect workflow

- **feature-name** (required): First argument (e.g., "new-feature", "bug-fix")
- **workflow**: Detect from arguments OR infer from context

**Workflow detection rules (in order):**

1. If explicit keyword present → use that workflow:
   - `simple` → simple
   - `plan-only` → plan-only
   - `implement-only` → implement-only
   - `plan-and-implement` → plan-and-implement

2. If a file path like `audit/*.md` is provided → `implement-only` (build from existing spec)

3. If a long description/prompt is provided (more than just feature name) → `plan-and-implement`
   - Phrases like "I want to build...", "Create a...", "Design...", "Build..." indicate planning needed
   - Phrases like "build with ralph", "implement", "then build" indicate implementation wanted

4. If only feature-name provided → `simple`

### 2. Call the MCP tool

**Always call `mcp__worktree__worktree_start`** with appropriate parameters:

**Simple:**
```json
{ "feature_name": "bug-fix" }
```

**Plan-only:**
```json
{
  "feature_name": "auth",
  "workflow": "plan-only",
  "plan_config": { "prompt": "Design OAuth2 login..." }
}
```

**Implement-only:**
```json
{
  "feature_name": "auth",
  "workflow": "implement-only",
  "ralph_config": { "source_file": "audit/auth.md" }
}
```

**Plan-and-implement:**
```json
{
  "feature_name": "comments",
  "workflow": "plan-and-implement",
  "plan_config": { "prompt": "Add comment system..." },
  "ralph_config": {}
}
```

### 3. Display results

- Show worktree path and branch created
- For automated workflows, explain what's running in background
- Provide monitoring commands: `tail -f /tmp/claude-worktree-*.log`

### 4. Error handling

- If MCP tool fails, show error and suggest fixes
- Common issues: not in git repo, branch exists, no initial commit

## Tips

- Feature name becomes `feature/<name>` branch
- Worktrees created in `~/worktrees/<feature-name>/`
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
