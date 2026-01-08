# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Worktree Manager is a two-layer system for parallel feature development using git worktrees:
- **Plugin layer** (`plugin/`): User-facing slash commands for Claude Code
- **MCP server layer** (`mcp-server/`): TypeScript backend with git operations (99% test coverage)

## Build & Development Commands

```bash
# Build MCP server (required before use)
cd mcp-server && npm install && npm run build

# Run tests
cd mcp-server && npm test

# Watch mode during development
cd mcp-server && npm run watch

# Coverage report
cd mcp-server && npm run test:coverage

# Lint
cd mcp-server && npm run lint
```

## Architecture

```
plugin/                          # Claude Code plugin (frontend)
├── .claude-plugin/plugin.json   # Plugin manifest - defines MCP server
└── commands/                    # Slash command markdown files
    ├── start.md                 # Main workflow entry point
    ├── list.md, status.md, cleanup.md

mcp-server/                      # TypeScript MCP server (backend)
└── src/
    ├── index.ts                 # MCP server entry, tool definitions
    ├── tools/                   # worktree-start.ts, -list.ts, -status.ts, -cleanup.ts
    ├── utils/                   # git-helpers, project-detector, setup-runner, config-reader
    ├── templates/               # Ralph prompt templates
    └── types.ts                 # TypeScript interfaces
```

## Key Concepts

**4 Workflows**: simple (manual), plan-only (feature-dev), implement-only (ralph-wiggum), plan-and-implement (full automation)

**Plugin Integration**: Commands chain to `feature-dev` and `ralph-wiggum` plugins for automated planning/implementation

**MCP Tools**: `worktree_start`, `worktree_list`, `worktree_status`, `worktree_cleanup` - exposed via Model Context Protocol

**Auto-detection**: Web projects (package.json) trigger `npm install`, iOS projects (Package.swift) trigger `swift build`

## Configuration

Users configure via `~/.claude/worktree-manager.local.md` (global) or `.claude/worktree-manager.local.md` (project). YAML frontmatter controls worktree_base_path, branch_prefix, default_workflow, auto_commit, auto_push, spec_directory, default_max_iterations.

## Adding Features

1. Implement TypeScript tool in `mcp-server/src/tools/`
2. Add tests in `mcp-server/tests/`
3. Export from `mcp-server/src/index.ts`
4. Create command markdown in `plugin/commands/`
5. Run `npm run build` in mcp-server
