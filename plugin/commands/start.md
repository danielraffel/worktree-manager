---
description: Create git worktree with auto-setup and optional automation workflows
argument-hint: "<feature-name> [options]"
allowed-tools:
  - "mcp__worktree__worktree_start"
  - "Read"
  - "Bash"
  - "Skill"
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

**CRITICAL REQUIREMENTS:**
1. **Always use the `mcp__worktree__worktree_start` MCP tool** to create/reuse worktrees
2. **NEVER manually run git commands** - no `git worktree add`, no `git branch`, no manual setup
3. **NEVER implement specs yourself** - chain to feature-dev and/or ralph-wiggum as needed
4. **If the MCP tool is unavailable, STOP and tell the user** - do not fall back to manual work

**If `mcp__worktree__worktree_start` fails or is not found:**
- Tell the user: "The worktree-manager MCP server is not available. Please ensure the plugin is installed correctly and the MCP server is built (`cd ~/worktree-manager/mcp-server && npm run build`)."
- Do NOT attempt to create worktrees manually
- Do NOT read the spec file and implement it yourself

---

## Step 1: Parse arguments and detect workflow

- **feature-name** (required): First argument (e.g., "new-feature", "bug-fix")
- **workflow**: Detect from arguments OR infer from context

**Workflow detection rules (in order):**

1. If explicit keyword present → use that workflow:
   - `simple` → simple
   - `plan-only` → plan-only
   - `implement-only` → implement-only
   - `plan-and-implement` → plan-and-implement

2. If a file path like `audit/*.md` or absolute path to .md file is provided → `implement-only`

3. If a long description/prompt is provided (more than just feature name) → `plan-and-implement`

4. If only feature-name provided → `simple`

---

## Step 2: Call MCP tool to create/reuse worktree

**Always call `mcp__worktree__worktree_start`** with `workflow: "simple"` - the MCP tool just creates the worktree, and YOU (Claude) will chain the plugins:

```json
{ "feature_name": "<feature-name>", "workflow": "simple" }
```

Save the returned `worktree_path` for the next steps.

---

## Step 3: Chain plugins based on workflow

**CRITICAL: You MUST chain the plugins automatically. Do NOT tell user to run commands manually.**

### Workflow: simple
- Just display the worktree path and next steps for manual work
- No chaining needed

### Workflow: plan-only (worktree → feature-dev)
After MCP tool succeeds:
1. Tell user: "Worktree ready. Starting feature-dev to create implementation plan..."
2. Invoke feature-dev using the Skill tool:
   ```
   Skill: feature-dev:feature-dev
   Args: <the planning prompt from user>
   ```
3. Feature-dev will run and create a spec file in the worktree

### Workflow: implement-only (worktree → ralph)
After MCP tool succeeds:
1. Tell user: "Worktree ready. Starting ralph-wiggum to implement from spec..."
2. **IMPORTANT: Do NOT use the Skill tool for ralph-wiggum** - the Skill tool cannot properly invoke ralph-loop because it has `hide-from-slash-command-tool: true` and its setup script won't execute.
3. **Run the setup script in the CURRENT directory** (not the worktree) - the Stop hook looks for the state file relative to the Claude session's cwd:
   ```bash
   SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)" && bash "$SCRIPT_PATH" "CRITICAL: Work ONLY in <worktree_path>/ using absolute paths. Do NOT modify files outside this directory. Implement the features described in <spec_file_path>

When implementation is complete and verified, you MUST output the literal text <promise>DONE</promise> to exit the loop." --max-iterations 50 --completion-promise DONE
   ```

   For example:
   ```bash
   SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)" && bash "$SCRIPT_PATH" "CRITICAL: Work ONLY in /Users/danielraffel/worktrees/unit-test/ using absolute paths. Do NOT modify files outside this directory. Implement the features described in /Users/danielraffel/snapguide/audit/unit-test-plan.md

When implementation is complete and verified, you MUST output the literal text <promise>DONE</promise> to exit the loop." --max-iterations 50 --completion-promise DONE
   ```
4. You should see "🔄 Ralph loop activated" message - this confirms ralph is running
5. After the script runs, **immediately start working on the task in the worktree** using absolute paths
6. Ralph will iterate and show "🔄 Ralph iteration N" as it works

### Workflow: plan-and-implement (worktree → feature-dev → ralph)
After MCP tool succeeds:
1. Tell user: "Worktree ready. Starting feature-dev to create implementation plan..."
2. Invoke feature-dev using the Skill tool:
   ```
   Skill: feature-dev:feature-dev
   Args: <the planning prompt from user>
   ```
3. After feature-dev completes and creates a spec file (usually in `audit/<feature-name>.md`), tell user: "Plan complete. Starting ralph-wiggum to implement..."
4. **IMPORTANT: Do NOT use the Skill tool for ralph-wiggum** - the Skill tool cannot properly invoke ralph-loop because it has `hide-from-slash-command-tool: true` and its setup script won't execute.
5. **Run the setup script in the CURRENT directory** (not the worktree) - the Stop hook looks for the state file relative to the Claude session's cwd:
   ```bash
   SCRIPT_PATH="$(find ~/.claude/plugins -name 'setup-ralph-loop.sh' -path '*ralph-wiggum*' 2>/dev/null | head -1)" && bash "$SCRIPT_PATH" "CRITICAL: Work ONLY in <worktree_path>/ using absolute paths. Do NOT modify files outside this directory. Implement the features described in <spec_file_path>

When implementation is complete and verified, you MUST output the literal text <promise>DONE</promise> to exit the loop." --max-iterations 50 --completion-promise DONE
   ```
6. You should see "🔄 Ralph loop activated" message - this confirms ralph is running
7. After the script runs, **immediately start working on the task in the worktree** using absolute paths
8. Ralph will iterate and show "🔄 Ralph iteration N" as it works

---

## Step 4: Error handling

**If MCP tool is not available:**
- STOP immediately
- Tell user: "The worktree-manager MCP server is not available."
- Suggest: "Run `cd ~/worktree-manager/mcp-server && npm run build` and restart Claude Code"

**If MCP tool fails:**
- Show the error message from the tool
- Common issues: not in git repo, branch exists, worktree has uncommitted changes
- Do NOT fall back to manual git commands

**If feature-dev or ralph-wiggum fails:**
- Show the error
- The worktree was still created successfully, user can retry the plugin manually

## Tips

- Feature name becomes `feature/<name>` branch
- Worktrees created in `~/worktrees/<feature-name>/`
- Web projects get automatic `npm install`
- Existing clean worktrees are automatically reused
- implement-only and plan-and-implement chain directly into ralph-wiggum

## Examples

**Simple** (worktree only):
```
User: /worktree-manager:start quick-fix
Claude:
  1. MCP tool → creates worktree
  2. Shows next steps for manual work
```

**Plan-only** (worktree → feature-dev):
```
User: /worktree-manager:start auth-system plan-only "Design OAuth2 authentication"
Claude:
  1. MCP tool → creates worktree
  2. Invokes /feature-dev:feature-dev with the prompt
  3. Feature-dev runs and creates spec
```

**Implement-only** (worktree → ralph):
```
User: /worktree-manager:start unit-test implement-only audit/unit-test-plan.md
Claude:
  1. MCP tool → creates/reuses worktree
  2. Runs setup-ralph-loop.sh directly via Bash (NOT Skill tool)
  3. Sees "🔄 Ralph loop activated" message
  4. Starts working on the task; Stop hook loops iterations
```

**Plan-and-implement** (worktree → feature-dev → ralph):
```
User: /worktree-manager:start comments plan-and-implement "Add comment system"
Claude:
  1. MCP tool → creates worktree
  2. Invokes /feature-dev:feature-dev via Skill tool
  3. Feature-dev creates spec
  4. Runs setup-ralph-loop.sh directly via Bash (NOT Skill tool)
  5. Sees "🔄 Ralph loop activated" message
  6. Starts working; Stop hook loops iterations
```
