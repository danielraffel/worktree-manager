/**
 * Default Ralph template for implementing features from specifications
 * Uses placeholders that get filled by template-filler
 */
export declare const RALPH_DEFAULT_TEMPLATE = "You are rebuilding this application.\n\nGOVERNING RULES:\n- The file 'claude.md' defines mandatory coding standards, architecture rules, and conventions.\n- You MUST read 'claude.md' at the start of EVERY iteration.\n- All code, tests, documentation, and commits MUST comply with 'claude.md'.\n- Any violation of 'claude.md' is a bug and must be fixed.\n\nSOURCE OF TRUTH:\n- The file '{{SOURCE_FILE}}' defines required features.\n\nTASK:\n- Read '{{SOURCE_FILE}}' at the start of EVERY iteration.\n- Identify all features that are:\n  - NOT implemented, or\n  - Partially implemented / incomplete.\n- Implement ALL missing or incomplete features in the current codebase.\n- Update work item status as you go\n\nRULES:\n- Do NOT stop after implementing a subset.\n- Do NOT assume a feature is complete without verifying the code.\n- If a feature requires tests, documentation, or UI work, it is NOT complete until those exist.\n- Modify, refactor, or rewrite existing code if necessary.\n{{WORK_ON_RULES}}\n\nGIT DISCIPLINE:\n- Commit at the end of EVERY iteration where changes were made.\n- Commits must be small, focused, and aligned to features in '{{SOURCE_FILE}}'.\n- Commit messages must be imperative and follow claude.md conventions.\n- Do NOT commit if no meaningful progress was made.\n\nEACH ITERATION MUST:\n1. Re-read claude.md\n2. Re-read '{{SOURCE_FILE}}'\n3. List remaining incomplete or missing items\n4. Implement as many as possible\n5. Verify against claude.md\n6. Run tests (if applicable)\n7. Commit changes (if any)\n8. Re-check which items remain\n\nCOMPLETION CONDITION:\n- '{{SOURCE_FILE}}' contains ZERO unimplemented or incomplete items\n- All features are fully implemented and verified\n- Tests pass\n- Code and commit history comply with claude.md\n\nONLY WHEN ALL CONDITIONS ARE MET:\nOutput exactly: <promise>DONE</promise>\n\nIF STUCK:\n- After 20 iterations, document:\n  - What is blocked\n  - Why\n  - What was attempted\n  - What assumption may be wrong\n  - Feel free to create migrations if blocked on database changes!";
export interface RalphTemplateVariables {
    source_file: string;
    work_on_rules: string;
}
/**
 * Available ralph templates
 * Future: Add more templates (minimal, full-stack, database-only, etc.)
 */
export declare const RALPH_TEMPLATES: Record<string, string>;
//# sourceMappingURL=ralph-default.d.ts.map