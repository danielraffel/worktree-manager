/**
 * Default Ralph template for implementing features from specifications
 * Uses placeholders that get filled by template-filler
 */

export const RALPH_DEFAULT_TEMPLATE = `You are rebuilding this application.

GOVERNING RULES:
- The file 'claude.md' defines mandatory coding standards, architecture rules, and conventions.
- You MUST read 'claude.md' at the start of EVERY iteration.
- All code, tests, documentation, and commits MUST comply with 'claude.md'.
- Any violation of 'claude.md' is a bug and must be fixed.

SOURCE OF TRUTH:
- The file '{{SOURCE_FILE}}' defines required features.

TASK:
- Read '{{SOURCE_FILE}}' at the start of EVERY iteration.
- Identify all features that are:
  - NOT implemented, or
  - Partially implemented / incomplete.
- Implement ALL missing or incomplete features in the current codebase.
- Update work item status as you go

RULES:
- Do NOT stop after implementing a subset.
- Do NOT assume a feature is complete without verifying the code.
- If a feature requires tests, documentation, or UI work, it is NOT complete until those exist.
- Modify, refactor, or rewrite existing code if necessary.
{{WORK_ON_RULES}}

GIT DISCIPLINE:
- Commit at the end of EVERY iteration where changes were made.
- Commits must be small, focused, and aligned to features in '{{SOURCE_FILE}}'.
- Commit messages must be imperative and follow claude.md conventions.
- Do NOT commit if no meaningful progress was made.

EACH ITERATION MUST:
1. Re-read claude.md
2. Re-read '{{SOURCE_FILE}}'
3. List remaining incomplete or missing items
4. Implement as many as possible
5. Verify against claude.md
6. Run tests (if applicable)
7. Commit changes (if any)
8. Re-check which items remain

COMPLETION CONDITION:
- '{{SOURCE_FILE}}' contains ZERO unimplemented or incomplete items
- All features are fully implemented and verified
- Tests pass
- Code and commit history comply with claude.md

ONLY WHEN ALL CONDITIONS ARE MET:
Output exactly: <promise>DONE</promise>

IF STUCK:
- After 20 iterations, document:
  - What is blocked
  - Why
  - What was attempted
  - What assumption may be wrong
  - Feel free to create migrations if blocked on database changes!`;

export interface RalphTemplateVariables {
  source_file: string;
  work_on_rules: string;
}

/**
 * Available ralph templates
 * Future: Add more templates (minimal, full-stack, database-only, etc.)
 */
export const RALPH_TEMPLATES: Record<string, string> = {
  default: RALPH_DEFAULT_TEMPLATE,
  // Future templates:
  // minimal: "...",
  // "full-stack": "...",
  // "database-only": "...",
};
