# Multi-Ecosystem Implementation Sketch

## Architecture Insight: AskUserQuestion Integration

**Key constraint:** MCP tools run in a subprocess and cannot directly use Claude's `AskUserQuestion` tool. However, the command layer (markdown files) instructs Claude, which CAN use `AskUserQuestion`.

**Solution:** Split detection and setup into separate MCP tools, with the command layer orchestrating user interaction.

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Command Layer (start.md)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Call worktree_start (creates worktree, skips setup)    │  │
│  │ 2. Call worktree_detect_ecosystems (scans ALL)            │  │
│  │ 3. If multiple ecosystems: use AskUserQuestion            │  │
│  │ 4. Call worktree_run_setup with selected ecosystems       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Server Layer                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ worktree_start  │  │ worktree_detect  │  │ worktree_setup │  │
│  │ (no auto-setup) │  │ (scan all 18)    │  │ (run selected) │  │
│  └─────────────────┘  └──────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## New/Modified MCP Tools

### 1. `worktree_detect_ecosystems` (NEW)

Scans ALL ecosystems in parallel, returns full list.

```typescript
// mcp-server/src/tools/worktree-detect.ts

interface DetectParams {
  worktree_path: string;
}

interface DetectedEcosystem {
  name: string;           // "Node.js", "Rust", "Swift"
  package_manager: string; // "npm", "cargo", "swift"
  command: string;         // "npm install", "cargo fetch"
  description: string;     // "Install dependencies"
}

interface DetectResult {
  ecosystems: DetectedEcosystem[];
  count: number;
}
```

**Implementation:** Modify `ProjectDetector` to add a `detectAll()` method that doesn't short-circuit.

### 2. `worktree_run_setup` (NEW)

Runs setup for specified ecosystems.

```typescript
// mcp-server/src/tools/worktree-setup.ts

interface SetupParams {
  worktree_path: string;
  ecosystems: string[];  // ["Node.js", "Rust"] - names from detect result
}

interface SetupResult {
  success: boolean;
  ran: string[];
  failed: string[];
  messages: string[];
}
```

### 3. `worktree_start` (MODIFIED)

Add config option `auto_run_setup: 'auto' | 'prompt' | false`

- `auto` (legacy): Current behavior, run first detected
- `prompt` (new default): Create worktree only, skip setup
- `false`: Skip detection entirely

## Modified Command Layer

### `commands/start.md` Changes

```markdown
---
description: Create git worktree with auto-setup
argument-hint: "<feature-name> [options]"
allowed-tools:
  - "mcp__worktree__worktree_start"
  - "mcp__worktree__worktree_detect_ecosystems"
  - "mcp__worktree__worktree_run_setup"
  - "AskUserQuestion"
  - "Read"
---

## Implementation Flow

1. **Create worktree** (no setup):
   ```javascript
   const result = await mcp__worktree__worktree_start({
     feature_name: "oauth-flow",
     base_branch: "main"
   });
   ```

2. **Detect ecosystems**:
   ```javascript
   const detected = await mcp__worktree__worktree_detect_ecosystems({
     worktree_path: result.worktree_path
   });
   ```

3. **Handle based on count**:

   **If 0 ecosystems:** Skip to success message

   **If 1 ecosystem:** Ask simple Y/n
   ```javascript
   const answer = await AskUserQuestion({
     questions: [{
       question: `Run ${detected.ecosystems[0].command}?`,
       header: "Setup",
       options: [
         { label: "Yes", description: "Run setup now" },
         { label: "Skip", description: "I'll set up manually" }
       ],
       multiSelect: false
     }]
   });
   ```

   **If 2+ ecosystems:** Show numbered options
   ```javascript
   const answer = await AskUserQuestion({
     questions: [{
       question: "Which project types should I set up?",
       header: "Setup",
       options: detected.ecosystems.map(e => ({
         label: e.name,
         description: e.command
       })),
       multiSelect: true  // Allow selecting multiple!
     }]
   });
   ```

4. **Run selected setup**:
   ```javascript
   if (selectedEcosystems.length > 0) {
     await mcp__worktree__worktree_run_setup({
       worktree_path: result.worktree_path,
       ecosystems: selectedEcosystems
     });
   }
   ```
```

## AskUserQuestion Usage

The `AskUserQuestion` tool is perfect for this because:

1. **Supports multiSelect** - User can pick multiple ecosystems
2. **Has "Other" option built-in** - User can type custom command
3. **Clean UI** - Shows as chips/buttons in Claude Code
4. **Non-blocking** - Fits naturally in conversation flow

### Example AskUserQuestion Call

```javascript
await AskUserQuestion({
  questions: [{
    question: "Which project types should I set up?",
    header: "Ecosystems",
    options: [
      { label: "Node.js (npm)", description: "npm install" },
      { label: "Rust", description: "cargo fetch" },
      { label: "Swift", description: "swift package resolve" },
      { label: "Skip all", description: "Don't run any setup" }
    ],
    multiSelect: true
  }]
});
```

**User sees:**
```
Ecosystems: Which project types should I set up?
  [x] Node.js (npm) - npm install
  [ ] Rust - cargo fetch
  [ ] Swift - swift package resolve
  [ ] Skip all - Don't run any setup
  [Other...]
```

## Config Changes

### `config-reader.ts`

```typescript
interface WorktreeConfig {
  // ... existing fields ...

  /** Setup behavior: 'auto' (run first), 'prompt' (ask user), false (skip) */
  auto_run_setup: 'auto' | 'prompt' | false;
}

// Default changes from true to 'prompt'
const DEFAULT_CONFIG: WorktreeConfig = {
  // ...
  auto_run_setup: 'prompt',
};
```

### Migration

- `auto_run_setup: true` → treated as `'auto'` (backward compatible)
- `auto_run_setup: false` → unchanged
- `auto_run_setup: 'prompt'` → new default

## File Changes Summary

| File | Change |
|------|--------|
| `mcp-server/src/tools/worktree-detect.ts` | NEW - detect all ecosystems |
| `mcp-server/src/tools/worktree-setup.ts` | NEW - run setup for selected |
| `mcp-server/src/utils/project-detector.ts` | Add `detectAll()` method |
| `mcp-server/src/utils/config-reader.ts` | Change `auto_run_setup` type |
| `mcp-server/src/index.ts` | Export new tools |
| `commands/start.md` | Add AskUserQuestion flow |
| `README.md` | Document new behavior |

## Alternative: Simpler Approach

If full AskUserQuestion integration feels heavy, a simpler option:

1. **Detect all ecosystems** (always)
2. **Return them in result** with `pending_setup: true`
3. **Let Claude decide** based on context:
   - Single ecosystem: Run automatically
   - Multiple: Ask user with AskUserQuestion
   - Config `auto_run_setup: auto`: Always run first (legacy)

This keeps MCP layer simpler - just detect and report. The "smart" behavior lives in the command instructions.

## Testing Plan

1. **Unit tests** for `detectAll()` method
2. **Unit tests** for `worktree_run_setup`
3. **Integration test**: Multi-ecosystem repo detection
4. **Manual test**: AskUserQuestion flow in Claude Code

## Rollout

1. Implement behind feature flag (`auto_run_setup: 'prompt'`)
2. Default to `'auto'` initially (no behavior change)
3. Test with real users
4. Flip default to `'prompt'` in next minor version
