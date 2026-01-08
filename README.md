# Worktree Manager

**Effortless git worktrees for parallel development**

A Claude Code plugin that creates and manages git worktrees with automatic environment setup. Built with a two-layer architecture: user-friendly plugin commands backed by a robust TypeScript MCP server.

## What This Does

Create isolated git worktrees for parallel feature development with one command. Automatically detects your project type and runs setup (npm install, swift build, etc.).

**Quick example**:
```bash
# Create worktree with auto-setup
/worktree-manager:start bug-fix

# Creates:
# - ~/worktrees/bug-fix/ directory
# - feature/bug-fix branch
# - Runs npm install (or appropriate setup)
```

## Key Features

- **One command** creates worktree + new branch
- **Auto-detects** project type (web, iOS, full-stack)
- **Auto-runs** setup (npm install, swift build, etc.)
- **Auto-copies** environment files (.env, .vscode) to new worktrees
- **99% test coverage** - reliable and well-tested
- **Parallel development** - work on multiple features simultaneously

## Architecture

This project consists of two layers:

```
┌─────────────────────────────────────────┐
│      Claude Code Plugin (Frontend)      │
│                                         │
│  • User-facing slash commands           │
│  • /worktree-manager:start              │
│  • /worktree-manager:list               │
│  • /worktree-manager:status             │
│  • /worktree-manager:cleanup            │
│                                         │
│  Commands call ↓                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      MCP Server (Backend)               │
│                                         │
│  • TypeScript tools (99% test coverage) │
│  • Git worktree operations              │
│  • Environment auto-detection           │
│  • Auto-setup execution                 │
│  • Project type detection               │
└─────────────────────────────────────────┘
```

### Why Two Layers?

- **Plugin layer**: User-friendly commands, integrates with Claude Code
- **MCP server layer**: Type-safe TypeScript with comprehensive tests
- **Separation of concerns**: UI in plugin, business logic in MCP server
- **Maintainability**: Update either layer independently

## Installation

### 1. Add the Marketplace

In Claude Code, run:

```bash
/plugin marketplace add danielraffel/generous-corp-marketplace
```

### 2. Install the Plugin

```bash
/plugin install worktree-manager@generous-corp-marketplace
```

Or use the interactive installer:
1. Type `/plugin`
2. Navigate to "generous-corp-marketplace"
3. Select "worktree-manager"
4. Click "Install for you (user scope)"

### 3. Restart Claude Code

Quit and reopen Claude Code to load the plugin.

### 4. Verify Installation

```bash
/plugin list
# Should show worktree-manager

/worktree-manager:list
# Should display your worktrees
```

## Usage

### Basic Worktree Creation

```bash
# Create worktree from main branch
/worktree-manager:start my-feature

# Custom base branch
/worktree-manager:start hotfix --base-branch=develop

# Custom location
/worktree-manager:start experiment --worktree-path=/tmp/test
```

### What Happens

1. Creates worktree at `~/worktrees/my-feature/`
2. Creates branch `feature/my-feature`
3. Detects project type (web → npm, iOS → swift, etc.)
4. Runs setup commands automatically
5. Suggests next steps

### Auto-Detection & Setup

| Project Type | Detection | Auto-Setup |
|--------------|-----------|------------|
| Web | `package.json` in root or `web/` | `npm install` |
| iOS | `Package.swift` | `swift build` |
| Full-stack | Both web + iOS | Both setups |

### List Worktrees

```bash
/worktree-manager:list
```

Shows all worktrees with:
- Path
- Branch name
- Commit SHA
- Uncommitted changes
- Untracked files

### Check Status

```bash
/worktree-manager:status
```

Shows git status for all worktrees.

### Cleanup

```bash
/worktree-manager:cleanup <path-or-branch>
```

Safely removes worktree after checking for uncommitted changes.

## Parallel Development

Worktree Manager enables true parallel development. You can:

1. **Create multiple worktrees** for different features
2. **Open separate Claude Code sessions** in each worktree
3. **Work on multiple features simultaneously** without conflicts

```bash
# Terminal 1: Work on feature A
/worktree-manager:start feature-a
cd ~/worktrees/feature-a
claude

# Terminal 2: Work on feature B
/worktree-manager:start feature-b
cd ~/worktrees/feature-b
claude
```

### Pairs with Chainer

For automated workflows (planning + implementation), pair with [Chainer](https://www.generouscorp.com/Chainer):

```bash
# Create worktree
/worktree-manager:start payments

# Use Chainer for automated development
/chainer:run plan-and-implement \
  --cwd="~/worktrees/payments" \
  --prompt="Add Stripe integration"
```

## Configuration

Create `~/.claude/worktree-manager.local.md` (global) or `.claude/worktree-manager.local.md` (project-specific):

```yaml
---
# Where to create worktrees (default: ~/worktrees)
worktree_base_path: ~/worktrees

# Branch prefix (default: feature/)
branch_prefix: feature/

# Create LEARNINGS.md in worktree to capture insights
create_learnings_file: false

# Auto-initialize git submodules (default: true)
auto_init_submodules: true

# Auto-copy environment files to new worktrees (default: true)
copy_files_enabled: true

# Glob patterns for files to copy (default: ['.env', '.env.*', '.vscode/**', '*.local'])
copy_file_patterns: [".env", ".env.*", ".vscode/**", "*.local"]

# Glob patterns to exclude from copying (default: ['node_modules', 'dist', 'build', 'coverage', '.git'])
exclude_file_patterns: ["node_modules", "dist", "build", "coverage", ".git"]

# Auto-commit changes during AI agent execution
auto_commit: false

# Auto-push to remote after commits
auto_push: false

# Default workflow type (always 'simple' for worktree-only)
default_workflow: simple

# Directory for spec files (default: audit)
spec_directory: audit

# Max iterations for automated workflows (default: 50)
default_max_iterations: 50
---

# Project-Specific Notes
Add any project-specific context or conventions here.
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `worktree_base_path` | `~/worktrees` | Base directory where all worktrees are created |
| `branch_prefix` | `feature/` | Prefix for new branches (e.g., `feature/my-task`) |
| `create_learnings_file` | `false` | Create `LEARNINGS.md` in worktree to capture insights |
| `auto_init_submodules` | `true` | Auto-initialize git submodules recursively in new worktrees |
| `copy_files_enabled` | `true` | Auto-copy development environment files to new worktrees |
| `copy_file_patterns` | `['.env', '.vscode/**', '*.local']` | Glob patterns for files to copy from main repo |
| `exclude_file_patterns` | `['node_modules', 'dist', '.git']` | Glob patterns to exclude from copying |
| `auto_commit` | `false` | Auto-commit changes during AI agent execution |
| `auto_push` | `false` | Auto-push to remote after commits |
| `default_workflow` | `simple` | Default workflow when not specified |
| `spec_directory` | `audit` | Directory for specification files |
| `default_max_iterations` | `50` | Maximum iterations for automated workflows |

## Development

### Build

```bash
cd mcp-server
npm install
npm run build
```

### Tests

```bash
cd mcp-server
npm test

# With coverage
npm run test:coverage
```

Current coverage: **99%** (42 passing tests)

### Watch Mode

```bash
cd mcp-server
npm run watch
```

### Lint

```bash
cd mcp-server
npm run lint
```

## Project Structure

```
worktree-manager/
├── plugin/                      # Claude Code plugin
│   ├── .claude-plugin/
│   │   └── plugin.json          # Plugin manifest
│   └── commands/
│       ├── start.md            # Create worktree
│       ├── list.md             # List worktrees
│       ├── status.md           # Check status
│       └── cleanup.md          # Remove worktree
│
├── mcp-server/                  # TypeScript MCP server
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── tools/              # MCP tools
│   │   │   ├── worktree-start.ts
│   │   │   ├── worktree-list.ts
│   │   │   ├── worktree-status.ts
│   │   │   └── worktree-cleanup.ts
│   │   ├── utils/              # Utilities
│   │   │   ├── git-helpers.ts
│   │   │   ├── project-detector.ts
│   │   │   ├── setup-runner.ts
│   │   │   ├── config-reader.ts
│   │   │   └── command-builder.ts
│   │   └── types.ts
│   ├── tests/                  # 99% coverage
│   │   └── unit/
│   ├── package.json
│   └── tsconfig.json
│
├── CLAUDE.md                    # Development guidance
├── README.md                    # This file
└── index.html                   # Marketing page
```

## Design Philosophy

Worktree Manager follows a focused, single-responsibility approach:

- **Do one thing well**: Create and manage git worktrees with automatic setup
- **Two-layer architecture**: User-friendly plugin commands + robust TypeScript backend
- **99% test coverage**: Reliable, well-tested codebase
- **Composable**: Works standalone or pairs with other plugins (like Chainer) for workflows
- **Clean separation**: Worktree operations here, workflow orchestration elsewhere

## Related Projects

- **[Chainer](https://www.generouscorp.com/Chainer)** - Universal plugin orchestration for Claude Code (pairs well with Worktree Manager for automated workflows)

## Contributing

Contributions welcome! Please:

1. Run tests: `cd mcp-server && npm test`
2. Ensure coverage stays at 99%+
3. Update README if adding features
4. Follow existing code style

## Troubleshooting

### Worktree already exists

```
❌ Worktree already exists with uncommitted changes
```

**Fix**: Commit or stash changes, or use `/worktree-manager:cleanup` to remove it.

### Not in a git repository

```
❌ Current directory is not a git repository
```

**Fix**: Navigate to a git repository first.

### Setup failed

```
⚠️ Worktree created but setup incomplete
```

**Fix**: Run setup manually:
```bash
cd ~/worktrees/my-feature
npm install  # or appropriate setup command
```

## License

MIT License - see LICENSE file for details

## Credits

Built by [Daniel Raffel](https://github.com/danielraffel) for the Claude Code community.

## Links

- [GitHub Repository](https://github.com/danielraffel/worktree-manager)
- [Chainer Plugin](https://www.generouscorp.com/Chainer)
- [Documentation Site](https://danielraffel.github.io/worktree-manager/)
