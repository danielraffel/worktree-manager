---
active: true
iteration: 1
max_iterations: 50
completion_promise: "DONE"
started_at: "2026-01-06T03:13:35Z"
---

You are building two Claude Code plugins that work together.

  PROJECTS:
  - Chainer: /Users/danielraffel/Code/Chainer (new plugin)
  - Worktree Manager: /Users/danielraffel/Code/worktree-manager (refactoring)

  SOURCE OF TRUTH:
  - /Users/danielraffel/Code/worktree-manager/FEATURE-PLAN-CHAINER-SPLIT.md

  CONTEXT FILES:
  - /Users/danielraffel/Code/Chainer/ai/PROJECT.md
  - /Users/danielraffel/Code/worktree-manager/ai/PROJECT.md

  EACH ITERATION:
  1. Read FEATURE-PLAN-CHAINER-SPLIT.md
  2. Find the Document Status table at the top
  3. Identify the FIRST phase that is NOT ✅ Complete
  4. Read that phase's tasks table
  5. Find tasks marked ⬜ and implement them
  6. Update task status in the plan (⬜ → ✅)
  7. When ALL tasks in a phase are ✅, update Document Status
  8. Run tests if the phase requires them
  9. Commit changes to the appropriate repo
  10. Continue to next incomplete phase

  PHASE NOTES:
  - Phase 0: Skip (manual testing only)
  - Phases 1, 3, 5: Work primarily in /Usefel/Code/Chainer
  - Phase 2: Work in /Users/danielraffel/Code/worktree-manager
  - Phases 4, 6: Work in both repos as needed

  GIT RULES:
  - Commit after meaningful progress
  - Use descriptive commit messages
  - Commit to correct repo based on files changed

  COMPLETION CONDITION:
  ALL of these must be true:
  - Document Status shows ALL phases ✅ Complete
  - All task tables show ALL tasks ✅
  - Tests pass in both repos
  - Both plugins are functional

  ONLY when ALL conditions are met, output: <promise>DONE</promise>

  IF STUCK after 20 iterations:
  - Document blockers in the appropriate ai/learnings.txt
  - List what was attempted
  - Continue trying or ask for help
  
