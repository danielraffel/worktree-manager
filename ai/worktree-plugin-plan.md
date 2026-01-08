# Worktree Manager Plugin - Complete Plan

**Status**: Planning
**Created**: 2025-12-31
**Purpose**: Automate git worktree creation and integrate with other Claude Code plugins for parallel development

---

## Overview

A Claude Code plugin that automates git worktree creation, environment setup, and integration with other plugins (feature-dev, ralph-wiggum, etc.) to enable true parallel development workflows.

**Core Problem Solved**:
User wants to work on multiple features simultaneously without:
- Manual git worktree commands
- Manual environment setup (npm install, etc.)
- Having to remember complex workflows
- Switching branches or stashing work

**Solution**:
Single command creates isolated worktree + automatically runs desired plugin/workflow in that environment.

---

## Design Constraints & Technical Realities

### Claude Code Session Limitation
⚠️ **Critical**: A Claude Code session is tied to a specific working directory. The plugin **cannot** switch the current session to a different directory.

**What this means:**
- Plugin creates worktree at a different path (e.g., `~/snapguide-worktrees/feature-name/`)
- User must either:
  - **Option A**: Open new terminal, cd to worktree, run `claude` with the desired command
  - **Option B**: Plugin runs command in background, returns immediately
  - **Option C**: Plugin provides ready-to-paste command for new terminal

**Chosen approach**: **Hybrid**
- Plugin creates worktree + setup
- Plugin offers both options: manual (copy/paste command) or background execution
- User chooses based on whether they want to monitor output

---

## Plugin Architecture

### Plugin Name: `worktree-manager`

### File Structure
```
~/.config/claude/plugins/worktree-manager/
├── plugin.json
├── package.json
├── tsconfig.json
├── src/
│   ├── tools/
│   │   ├── worktree-start.ts       # Main: create + optional auto-run
│   │   ├── worktree-list.ts        # List all worktrees
│   │   ├── worktree-status.ts      # Check status of worktree
│   │   ├── worktree-cleanup.ts     # Merge and remove worktree
│   │   └── worktree-switch.ts      # Generate command to switch to worktree
│   ├── workflows/
│   │   ├── plan-and-implement.ts   # feature-dev → ralph-wiggum chain
│   │   └── workflow-types.ts       # Workflow type definitions
│   ├── utils/
│   │   ├── git-helpers.ts          # Git command wrappers
│   │   ├── project-detector.ts     # Detect project type
│   │   ├── setup-runner.ts         # Run npm install, etc.
│   │   ├── command-builder.ts      # Build Claude commands
│   │   └── script-generator.ts     # Generate helper scripts
│   └── types.ts
└── README.md
```

---

## Tool Specifications

### 1. `worktree_start` - Primary Tool

**Purpose**: Create worktree with optional auto-execution of plugins/skills

**Signature**:
```typescript
{
  name: "worktree_start",
  description: "Create git worktree with environment setup and optional plugin auto-run",
  parameters: {
    feature_name: {
      type: "string",
      required: true,
      description: "Name of feature (becomes branch: feature/<name>)"
    },
    base_branch: {
      type: "string",
      required: false,
      default: "main",
      description: "Branch to branch from"
    },
    task_description: {
      type: "string",
      required: false,
      description: "What you're working on (for context)"
    },
    worktree_path: {
      type: "string",
      required: false,
      default: "~/snapguide-worktrees/<feature_name>",
      description: "Custom worktree location"
    },
    auto_run: {
      type: "object",
      required: false,
      description: "Optional command to run in worktree",
      properties: {
        plugin: {
          type: "string",
          description: "Plugin/skill to run (e.g., 'feature-dev', 'ralph-wiggum:ralph-loop')"
        },
        args: {
          type: "string",
          description: "Arguments to pass to plugin"
        },
        execution_mode: {
          type: "string",
          enum: ["manual", "background", "interactive"],
          default: "manual",
          description: "How to run: manual (copy/paste), background (auto-run), interactive (prompt user)"
        }
      }
    },
    workflow: {
      type: "string",
      required: false,
      enum: ["simple", "plan-and-implement"],
      default: "simple",
      description: "Preset workflow pattern"
    }
  }
}
```

**What it does**:
1. **Validate inputs**
   - Check current directory is a git repo
   - Check base_branch exists
   - Check worktree doesn't already exist

2. **Create worktree**
   - Run: `git worktree add -b feature/<feature_name> <worktree_path> <base_branch>`
   - Handle errors (branch exists, path conflicts, etc.)

3. **Detect project type**
   - Check for `web/package.json` → web project
   - Check for `ios/` directory → iOS project
   - Check for `package.json` at root → Node project

4. **Auto-setup environment**
   - Web project: `cd <worktree_path>/web && npm install`
   - Root Node: `cd <worktree_path> && npm install`
   - Verify setup succeeded (check exit codes)

5. **Handle auto_run if specified**
   - **manual mode**: Generate command string, return to user
   - **background mode**: Execute command via Bash tool with `run_in_background: true`
   - **interactive mode**: Ask user which mode to use

6. **Return result**
   - Worktree location
   - Branch name
   - Setup status
   - Next steps (command to run or background task ID)

---

## Scenario Walkthroughs

### Scenario 1: Worktree + feature-dev

**User intent**: "Create a worktree and use feature-dev to plan the sign-in rebuild"

**Conversation**:
```
User: "Create a worktree for sign-in rebuild and use feature-dev to plan it"

Claude: [Detects intent, calls worktree_start tool]
```

**Tool call**:
```typescript
worktree_start({
  feature_name: "signin-rebuild",
  base_branch: "main",
  task_description: "Rebuild sign-in from audit/signin/final-proposal.md",
  auto_run: {
    plugin: "feature-dev",
    args: "Plan sign-in rebuild based on requirements in audit/signin/final-proposal.md",
    execution_mode: "interactive"  // Ask user
  }
})
```

**Plugin execution**:
1. Creates `~/snapguide-worktrees/signin-rebuild/`
2. Creates branch `feature/signin-rebuild` from `main`
3. Runs `npm install` in `web/`
4. Detects `auto_run.execution_mode = "interactive"`
5. Returns:

**Claude's response**:
```
✅ Worktree created successfully!

📁 Location: ~/snapguide-worktrees/signin-rebuild
🌿 Branch: feature/signin-rebuild (from main)
✅ Environment setup: npm install completed in web/

I can run feature-dev to create the plan. Choose how:

  A) Run in new terminal (you monitor output):
     cd ~/snapguide-worktrees/signin-rebuild
     claude
     /feature-dev "Plan sign-in rebuild based on audit/signin/final-proposal.md"

  B) Run in background (returns immediately):
     I'll start feature-dev in the worktree now. You can continue working
     here while it runs. I'll notify you when complete.

  C) Create helper script:
     I'll save the command to a script you can run anytime:
     ~/snapguide-worktrees/signin-rebuild/run-plan.sh

Which would you prefer? (A/B/C)
```

**User chooses B (background)**:

Plugin runs:
```bash
cd ~/snapguide-worktrees/signin-rebuild && \
  claude skill feature-dev "Plan sign-in rebuild based on audit/signin/final-proposal.md"
```

Returns task ID for monitoring.

---

### Scenario 2: Worktree + ralph-wiggum (long running)

**User intent**: "Run ralph-wiggum on signin features in a worktree so I can work on other things"

**Conversation**:
```
User: "Start a worktree for signin features and run ralph-wiggum to implement everything from audit/signin/final-proposal.md in the background"

Claude: [Calls worktree_start with auto_run]
```

**Tool call**:
```typescript
worktree_start({
  feature_name: "signin-features",
  base_branch: "main",
  auto_run: {
    plugin: "ralph-wiggum:ralph-loop",
    args: `"You are rebuilding this application.

GOVERNING RULES:
- The file 'claude.md' defines mandatory coding standards, architecture rules, and conventions.
- You MUST read 'claude.md' at the start of EVERY iteration.
- All code, tests, documentation, and commits MUST comply with 'claude.md'.
- Any violation of 'claude.md' is a bug and must be fixed.

SOURCE OF TRUTH:
- The file 'audit/signin/final-proposal.md' defines required features.

TASK:
- Read 'audit/signin/final-proposal.md' at the start of EVERY iteration.
- Identify all features that are NOT implemented or partially implemented.
- Implement ALL missing or incomplete features in the current codebase.
- Update work item status as you go.

RULES:
- Do NOT stop after implementing a subset.
- Work on all items in Phase 6: Progressive Engagement - Comments.
- DO NOT work on items in Phase 7.

GIT DISCIPLINE:
- Commit at the end of EVERY iteration where changes were made.
- Commits must be small, focused, and aligned to features in audit/signin/final-proposal.md.
- Commit messages must be imperative and follow claude.md conventions.

EACH ITERATION MUST:
1. Re-read claude.md
2. Re-read audit/signin/final-proposal.md
3. List remaining incomplete items
4. Implement as many as possible
5. Verify against claude.md
6. Run tests (if applicable)
7. Commit changes (if any)
8. Re-check which items remain

COMPLETION CONDITION:
- audit/signin/final-proposal.md contains ZERO unimplemented items
- All features are fully implemented and verified
- Tests pass
- Code and commit history comply with claude.md

ONLY WHEN ALL CONDITIONS ARE MET:
Output exactly: <promise>DONE</promise>

IF STUCK:
- After 20 iterations, document what is blocked, why, and what was attempted.
" --completion-promise "DONE" --max-iterations 50`,
    execution_mode: "background"  // Auto-run in background
  }
})
```

**Plugin execution**:
1. Creates `~/snapguide-worktrees/signin-features/`
2. Creates branch `feature/signin-features` from `main`
3. Runs `npm install` in `web/`
4. Detects `execution_mode = "background"`
5. Starts background task:
```bash
cd ~/snapguide-worktrees/signin-features && \
  claude skill ralph-wiggum:ralph-loop "<full-prompt>" \
    --completion-promise "DONE" --max-iterations 50
```
6. Returns task ID

**Claude's response**:
```
✅ Worktree created and ralph-wiggum started!

📁 Worktree: ~/snapguide-worktrees/signin-features
🌿 Branch: feature/signin-features
🤖 Background task: ralph-loop-signin-features (ID: task_abc123)

Ralph-wiggum is now implementing features from audit/signin/final-proposal.md
in the background. You can continue working here.

Monitor progress:
  /tasks                    # List all background tasks
  /logs task_abc123         # View ralph-wiggum output

When complete, I'll notify you and you can merge the changes:
  worktree_cleanup({ feature_name: "signin-features", auto_merge: true })

You can continue working on other tasks here while ralph works in parallel!
```

---

### Scenario 3: Future Idea - Plan & Implement Chain

**User intent**: "Create a spec for new messaging feature, then have ralph implement it automatically"

**Conversation**:
```
User: "Create a worktree, use feature-dev to plan a new admin messaging system, save the plan to audit/admin-messaging.md, then have ralph-wiggum implement it all automatically"

Claude: [Calls worktree_start with workflow: "plan-and-implement"]
```

**Tool call**:
```typescript
worktree_start({
  feature_name: "admin-messaging",
  base_branch: "main",
  workflow: "plan-and-implement",
  workflow_config: {
    plan_prompt: "Design comprehensive admin messaging system with inbox, compose, templates, and bulk messaging",
    spec_file: "audit/admin-messaging.md",
    implement_after_plan: true,
    ralph_max_iterations: 100
  }
})
```

**Plugin execution**:
1. Creates worktree `~/snapguide-worktrees/admin-messaging/`
2. Runs `npm install`
3. **Phase 1: Planning**
   - Calls feature-dev skill with plan_prompt
   - Saves output to audit/admin-messaging.md
   - Validates spec was created
4. **Phase 2: Implementation** (if implement_after_plan = true)
   - Generates ralph-wiggum prompt using the spec file
   - Runs ralph-loop in background
   - Returns task ID
5. Returns status

**Claude's response**:
```
✅ Worktree created: ~/snapguide-worktrees/admin-messaging

Phase 1: Planning
  ✅ feature-dev created comprehensive spec
  ✅ Saved to: audit/admin-messaging.md
  📄 Spec includes: 15 features, database schema, API design, UI components

Phase 2: Implementation (RUNNING)
  🤖 ralph-wiggum is now implementing all features from the spec
  📊 Task ID: task_xyz789
  ⏱️  Max iterations: 100
  🎯 Completion signal: <promise>DONE</promise>

Monitor progress:
  /logs task_xyz789

Estimated time: 2-4 hours (ralph will commit frequently)

I'll notify you when implementation is complete. You can continue working
on other features here in the main repo!
```

**When ralph finishes**:
```
🎉 Implementation complete!

ralph-wiggum has finished implementing admin-messaging features.

Summary:
  ✅ 15/15 features implemented
  ✅ 47 commits made (following claude.md conventions)
  ✅ Tests passing
  ✅ No violations of coding standards

Next steps:
  1. Review changes in worktree: cd ~/snapguide-worktrees/admin-messaging
  2. Test manually if desired
  3. Merge to main: worktree_cleanup({ feature_name: "admin-messaging", auto_merge: true })

Would you like me to merge this now or would you prefer to review first?
```

---

## Tool Signatures (Complete)

### 2. `worktree_list`

**Purpose**: Show all active worktrees with status

**Signature**:
```typescript
{
  name: "worktree_list",
  description: "List all git worktrees with status information",
  parameters: {
    show_status: {
      type: "boolean",
      default: true,
      description: "Include git status (uncommitted changes, ahead/behind)"
    }
  }
}
```

**Output**:
```
Active worktrees:

  main (main branch)
    📁 /Users/danielraffel/snapguide
    ✅ Clean working tree
    📊 Up to date with origin/main

  signin-features (feature/signin-features)
    📁 ~/snapguide-worktrees/signin-features
    🔶 3 uncommitted changes
    📊 5 commits ahead of origin/feature/signin-features
    🤖 ralph-wiggum running (task_abc123)

  admin-messaging (feature/admin-messaging)
    📁 ~/snapguide-worktrees/admin-messaging
    ✅ Clean working tree
    📊 12 commits ahead of origin/feature/admin-messaging
    🎉 Ready to merge
```

### 3. `worktree_status`

**Purpose**: Detailed status of specific worktree

**Signature**:
```typescript
{
  name: "worktree_status",
  description: "Get detailed status of a worktree",
  parameters: {
    feature_name: {
      type: "string",
      required: false,
      description: "Feature name (or auto-detect from current directory)"
    }
  }
}
```

**Output**:
```
Worktree: signin-features
📁 Location: ~/snapguide-worktrees/signin-features
🌿 Branch: feature/signin-features (from main)

Git Status:
  ✅ 12 commits ahead of main
  🔶 3 modified files
  ⚠️  1 untracked file
  📊 Branch exists on remote: Yes

Environment:
  ✅ npm packages installed (web/)
  ✅ Database migrations applied
  ⚠️  Supabase not running (run: supabase start)

Background Tasks:
  🤖 ralph-loop-signin (task_abc123)
     Status: Running (iteration 23/50)
     Started: 2 hours ago
     Last commit: 5 minutes ago

Next Actions:
  - Commit uncommitted changes
  - Push to remote: git push origin feature/signin-features
  - Or merge when ready: worktree_cleanup({ feature_name: "signin-features" })
```

### 4. `worktree_cleanup`

**Purpose**: Merge worktree and clean up

**Signature**:
```typescript
{
  name: "worktree_cleanup",
  description: "Merge worktree changes and remove worktree",
  parameters: {
    feature_name: {
      type: "string",
      required: true,
      description: "Name of feature to clean up"
    },
    target_branch: {
      type: "string",
      required: false,
      default: "main",
      description: "Branch to merge into"
    },
    auto_merge: {
      type: "boolean",
      required: false,
      default: false,
      description: "Auto-merge without confirmation"
    },
    delete_branch: {
      type: "boolean",
      required: false,
      default: true,
      description: "Delete feature branch after merge"
    },
    push_after_merge: {
      type: "boolean",
      required: false,
      default: true,
      description: "Push to remote after merging"
    }
  }
}
```

**What it does**:
1. Check for uncommitted changes (offer to commit)
2. Check for background tasks (offer to wait/cancel)
3. Switch to target branch in main repo
4. Pull latest from remote
5. Merge feature branch
6. Run tests (if configured)
7. Push to remote (if push_after_merge = true)
8. Remove worktree directory
9. Delete branch (if delete_branch = true)

### 5. `worktree_switch`

**Purpose**: Generate command to switch to worktree

**Signature**:
```typescript
{
  name: "worktree_switch",
  description: "Get command to switch to a worktree in new terminal",
  parameters: {
    feature_name: {
      type: "string",
      required: true,
      description: "Name of feature worktree to switch to"
    },
    open_editor: {
      type: "boolean",
      required: false,
      default: false,
      description: "Include command to open editor (code/cursor)"
    }
  }
}
```

**Output**:
```
To switch to signin-features worktree:

Copy and run in a new terminal:
  cd ~/snapguide-worktrees/signin-features
  code .
  claude

Or run as one command:
  cd ~/snapguide-worktrees/signin-features && code . && claude
```

---

## Workflow Presets

### Workflow: `plan-and-implement`

**Purpose**: Chain feature-dev (planning) → ralph-wiggum (implementation)

**Config**:
```typescript
{
  workflow: "plan-and-implement",
  workflow_config: {
    plan_prompt: string,          // What to plan
    spec_file: string,            // Where to save spec (e.g., "audit/feature.md")
    implement_after_plan: boolean, // Auto-start ralph after planning
    ralph_max_iterations: number,  // Max iterations for ralph
    ralph_phase_filter?: string    // Optional: "Phase 6" to limit scope
  }
}
```

**Execution flow**:
```
1. Create worktree
2. Run npm install
3. Call feature-dev with plan_prompt
4. Save output to spec_file
5. If implement_after_plan:
   a. Generate ralph-wiggum prompt using spec_file
   b. Start ralph-loop in background
   c. Return task ID
6. Return status
```

---

## Integration Points with Existing Plugins

### Integration with `feature-dev`

**How it works**:
- Worktree plugin calls: `claude skill feature-dev "<prompt>"`
- Captures output (the plan markdown)
- Saves to specified file location
- Returns success/failure

**Example**:
```typescript
// In worktree-start.ts
if (auto_run.plugin === "feature-dev") {
  const result = await runClaudeSkill("feature-dev", auto_run.args);
  if (workflow_config.spec_file) {
    await saveSpecFile(workflow_config.spec_file, result.output);
  }
}
```

### Integration with `ralph-wiggum`

**How it works**:
- Worktree plugin generates ralph-wiggum prompt
- Calls: `claude skill ralph-wiggum:ralph-loop "<prompt>" --completion-promise "DONE" --max-iterations N`
- If background mode: uses Bash tool with `run_in_background: true`
- Returns task ID for monitoring

**Example**:
```typescript
// In worktree-start.ts
if (auto_run.plugin === "ralph-wiggum:ralph-loop") {
  if (execution_mode === "background") {
    const taskId = await runInBackground(
      `cd ${worktreePath} && claude skill ralph-wiggum:ralph-loop "${auto_run.args}" --completion-promise "DONE" --max-iterations ${max_iterations}`
    );
    return { taskId, status: "running" };
  }
}
```

### Can plugins call other plugins?

**Yes!** Via three mechanisms:

1. **Shell execution**: `claude skill <plugin-name> "<args>"`
   - Works but spawns new process
   - Can run in background with Bash tool

2. **MCP tool invocation** (if plugins expose MCP tools):
   - Direct tool-to-tool calls
   - More efficient than shell execution

3. **Skill system**: Plugins can invoke skills
   - Built-in to Claude Code
   - Clean API for skill invocation

**Recommended approach for worktree plugin**: Shell execution with background support

---

## User Experience Examples

### Example 1: Quick feature with plan

```
User: "Create worktree for password reset and plan it with feature-dev"

Claude: [Calls worktree_start]

Claude: "✅ Worktree ready at ~/snapguide-worktrees/password-reset

I can run feature-dev to create the plan. Options:
  A) Manual (you run in new terminal)
  B) Background (I run it now)
  C) Save as script

Prefer A/B/C?"

User: "B"

Claude: "Started feature-dev in background (task_xyz).

I'll let you know when the plan is ready. You can continue working here!"

[5 minutes later]

Claude: "✅ Password reset plan complete!

Spec saved to: ~/snapguide-worktrees/password-reset/PLAN.md

Would you like me to:
  1. Start implementing it with ralph-wiggum
  2. Let you review the plan first
  3. Switch to that worktree so you can implement manually"
```

### Example 2: Long-running implementation

```
User: "Run ralph on audit/signin/final-proposal.md in a worktree in the background"

Claude: [Calls worktree_start with auto_run]

Claude: "✅ Worktree created: ~/snapguide-worktrees/signin-features
🤖 ralph-wiggum started (task_abc123)

Ralph is implementing all features from audit/signin/final-proposal.md.
This will run for 1-3 hours.

Monitor: /logs task_abc123
Stop: /kill task_abc123

You can continue working here. I'll notify you when complete!"

[Later]

User: "How's ralph doing?"

Claude: [Calls worktree_status]

Claude: "Ralph is making good progress on signin-features:

Iteration: 34/50
Time running: 2h 15m
Commits made: 23
Last activity: 2 minutes ago (committed 'Add email verification flow')

Still implementing: 4 remaining features
Next up: Password reset UI

Estimated completion: 45 minutes"
```

### Example 3: Plan then implement chain

```
User: "Create a complete admin notification system - plan it and implement it all automatically in a worktree"

Claude: [Calls worktree_start with workflow: "plan-and-implement"]

Claude: "Creating worktree with plan-and-implement workflow...

✅ Worktree: ~/snapguide-worktrees/admin-notifications

Phase 1: Planning (feature-dev)
  🔄 Analyzing requirements...
  ✅ Created comprehensive spec (12 pages)
  ✅ Saved to: audit/admin-notifications.md

Phase 2: Implementation (ralph-wiggum)
  🤖 Started ralph-loop (task_abc123)
  📊 Max iterations: 100
  🎯 Target: All features in spec

Spec includes:
  - Database schema (5 new tables)
  - API endpoints (12 routes)
  - Admin UI (8 components)
  - Email templates (6 templates)
  - Notification preferences

Ralph will implement everything. Estimated time: 3-5 hours.

Monitor: /logs task_abc123

I'll notify you when complete!"
```

---

## Technical Implementation Notes

### Background Task Management

**Challenge**: How to run long-running tasks in worktree directories?

**Solution**: Use Bash tool with `run_in_background: true`

```typescript
async function runInBackground(command: string): Promise<string> {
  const result = await bash({
    command: command,
    run_in_background: true,
    description: "Run plugin in worktree"
  });

  return result.taskId;
}
```

**Monitoring tasks**:
- User can check: `/tasks` (built-in Claude command)
- Plugin can query task status
- Can read logs via: `/logs <task-id>`

### Script Generation

For manual mode, generate helper scripts:

```bash
#!/bin/bash
# Generated by worktree-manager plugin
# Feature: signin-features

cd ~/snapguide-worktrees/signin-features

echo "Starting Claude Code in signin-features worktree..."
echo "Run this command in Claude:"
echo ""
echo "/ralph-wiggum:ralph-loop \"<full-prompt>\" --completion-promise \"DONE\" --max-iterations 50"
echo ""

claude
```

### Git Operations

**Worktree creation**:
```bash
git worktree add -b feature/<name> <path> <base-branch>
```

**Worktree removal**:
```bash
git worktree remove <path>
```

**Branch deletion**:
```bash
git branch -d feature/<name>  # Safe delete (only if merged)
git branch -D feature/<name>  # Force delete
```

**Merge workflow**:
```bash
cd <main-repo>
git checkout <target-branch>
git pull origin <target-branch>
git merge feature/<name>
git push origin <target-branch>
```

### Error Handling

**Common errors**:
1. Not a git repo → Abort with clear message
2. Branch already exists → Offer to reuse or choose new name
3. Worktree path exists → Offer to clean up or choose new path
4. Base branch doesn't exist → List available branches
5. npm install fails → Return error, don't continue
6. Background task fails → Notify user with error details

---

## Advantages of This Design

1. **Zero manual commands** - User just describes intent
2. **True parallelism** - Work in main repo while worktree runs
3. **Plugin composition** - Chains feature-dev → ralph-wiggum automatically
4. **Flexible execution** - Manual, background, or interactive modes
5. **Safe** - Validates state before all operations
6. **Observable** - Monitor background tasks anytime
7. **Reusable** - Works for any git repo, any plugin combination

---

## Future Enhancements

### Phase 2 Features (Later)

1. **Auto-open in IDE**
   - Detect VSCode/Cursor
   - Run: `code <worktree-path>` automatically

2. **Worktree templates**
   - Save common workflows
   - Example: "ralph-full" = plan + implement + test + merge

3. **Multi-worktree orchestration**
   - Start multiple worktrees in parallel
   - Different features, all running simultaneously

4. **Auto-merge on completion**
   - When ralph signals DONE, auto-merge to main
   - Optional: require test passing first

5. **Progress notifications**
   - Send system notifications when background tasks complete
   - Slack/email integration for long-running tasks

6. **Worktree snapshots**
   - Save state of worktree (commits, env, tasks)
   - Restore later if needed

---

## Development Roadmap

### Week 1: Core Infrastructure
- [ ] Set up plugin structure
- [ ] Implement `worktree_start` (basic - no auto_run)
- [ ] Implement git helpers
- [ ] Implement project detection
- [ ] Implement environment setup (npm install)
- [ ] Test manually

### Week 2: Auto-Run Integration
- [ ] Implement command builder
- [ ] Implement manual mode (generate commands)
- [ ] Implement background mode (Bash tool)
- [ ] Implement interactive mode (ask user)
- [ ] Test with feature-dev
- [ ] Test with ralph-wiggum

### Week 3: Additional Tools
- [ ] Implement `worktree_list`
- [ ] Implement `worktree_status`
- [ ] Implement `worktree_cleanup`
- [ ] Implement `worktree_switch`
- [ ] Add error handling

### Week 4: Workflows
- [ ] Implement `plan-and-implement` workflow
- [ ] Test full chain: feature-dev → ralph-wiggum
- [ ] Test background task monitoring
- [ ] Test merge workflows

### Week 5: Polish
- [ ] Add comprehensive error messages
- [ ] Add examples to README
- [ ] Update CLAUDE.md with usage patterns
- [ ] Test edge cases
- [ ] User acceptance testing

---

## Success Criteria

**Plugin is successful if:**

1. ✅ User can create worktree with single command
2. ✅ Environment auto-setup works reliably
3. ✅ feature-dev runs correctly in worktree
4. ✅ ralph-wiggum runs correctly in background
5. ✅ Plan-and-implement chain works end-to-end
6. ✅ User can monitor background tasks
7. ✅ Merge workflow is safe and reliable
8. ✅ No manual git commands needed (unless user prefers)

**Measurement**:
- User completes workflow in <2 minutes (vs 10-15 manual)
- Zero git errors from plugin operations
- Background tasks complete without intervention
- User can run 2+ parallel worktrees successfully

---

## Questions & Decisions

### Q1: Should plugin auto-merge when ralph signals DONE?
**Decision**: No, but offer it as an option. User may want to review first.

**Implementation**: When ralph completes, plugin notifies user and asks:
```
Ralph completed signin-features!

Options:
  A) Merge to main now (I'll handle it)
  B) Let me review first (manual)
  C) Run tests first, then merge

Prefer A/B/C?
```

### Q2: What if user creates worktree but doesn't specify plugin to run?
**Decision**: That's fine! Just create the worktree and return "ready to use" status.

**Use case**: User wants worktree for manual work, not plugin automation.

### Q3: Can user have multiple ralph instances running simultaneously?
**Decision**: Yes! Each worktree is isolated.

**Example**:
- Worktree 1: ralph implementing signin (background)
- Worktree 2: ralph implementing admin-messaging (background)
- Main repo: User working on bug fixes

All three work independently!

### Q4: What if ralph gets stuck or infinite loops?
**Decision**:
- User can kill with: `/kill <task-id>`
- Plugin can detect no commits in 30min → warn user
- Max iterations prevents true infinite loops

### Q5: Should plugin support iOS-only features (no web setup)?
**Decision**: Yes, detect iOS-only projects and skip npm install.

**Detection**:
- Has `ios/` but no `web/` → iOS-only
- Has `web/` but no `ios/` → Web-only
- Has both → Full-stack (setup both)

---

## CLAUDE.md Updates

Add this section to CLAUDE.md:

```markdown
## Git Worktree Workflow with Worktree Manager Plugin

**Purpose**: Work on multiple features in parallel without branch switching or conflicts.

### Quick Start

**Create worktree and plan feature**:
```
"Create a worktree for <feature-name> and use feature-dev to plan it"
```

**Create worktree and implement in background**:
```
"Create a worktree for <feature-name> and run ralph-wiggum on <spec-file> in the background"
```

**Plan and implement automatically**:
```
"Create a worktree, plan <feature-name>, and implement it all automatically"
```

### Commands

**List worktrees**:
```
"List all my worktrees"
```

**Check worktree status**:
```
"What's the status of <feature-name> worktree?"
```

**Merge and cleanup**:
```
"Merge <feature-name> worktree to main and clean up"
```

### Workflows

**Workflow 1: Quick feature with plan**
1. User: "Create worktree for password-reset and plan it"
2. Plugin creates worktree + runs feature-dev
3. User reviews plan
4. User decides: implement manually or have ralph do it

**Workflow 2: Long-running implementation**
1. User: "Run ralph on audit/signin/final-proposal.md in a worktree"
2. Plugin creates worktree + starts ralph in background
3. User continues working in main repo
4. Plugin notifies when complete
5. User reviews and merges

**Workflow 3: Fully automated**
1. User: "Plan and implement admin notifications feature"
2. Plugin creates worktree
3. Plugin runs feature-dev → saves spec
4. Plugin runs ralph-wiggum → implements spec
5. User waits for completion notification
6. User reviews and merges

### Best Practices

- **Use worktrees for**: Parallel development, long-running implementations, experimentation
- **Use main repo for**: Quick fixes, documentation, reviews
- **Monitor background tasks**: Use `/tasks` and `/logs <task-id>`
- **Review before merging**: Always check git log before merging worktree
- **Clean up regularly**: Don't let worktrees accumulate, merge or delete when done
```

---

## Conclusion

This plugin design supports all three scenarios:

✅ **Scenario 1**: Worktree + feature-dev
- Creates worktree, runs feature-dev (manual or background)
- User gets plan, can implement or hand to ralph

✅ **Scenario 2**: Worktree + ralph-wiggum (long-running)
- Creates worktree, runs ralph in background
- User continues working elsewhere
- Notification when complete

✅ **Future idea**: Plan → implement chain
- Automated workflow runs feature-dev first
- Captures spec
- Runs ralph-wiggum with spec automatically
- Fully automated feature development

**Key insight**: By combining worktrees (isolation) + background execution (parallelism) + plugin composition (automation), we achieve true parallel development with zero manual overhead.

User just describes intent → Plugin handles everything → User gets notification when ready to merge.
