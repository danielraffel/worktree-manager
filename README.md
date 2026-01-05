# Worktree Manager

**Effortless git worktrees for parallel development**

A two-layer system combining a Claude Code plugin with an MCP server for creating and managing git worktrees with automatic environment setup.

## What This Does

Create isolated git worktrees for parallel feature development with automatic environment setup. Works standalone or pairs with **Chainer** plugin for automated workflows.

**Quick example**:
```bash
# Create worktree
/worktree-manager:start oauth-flow

# For automated workflows, use Chainer
/chainer:run plan-and-implement \
  --prompt="Build OAuth2 authentication" \
  --feature_name="oauth-flow"
```

## Key Features

- **One command** creates worktree + new branch
- **Auto-detects** project type (web, iOS, full-stack)
- **Auto-runs** setup (npm install, swift build, etc.)
- **99% test coverage** - reliable and well-tested
- **Pairs with Chainer** for automated planning & implementation

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

### 1. Install the MCP Server

```bash
cd ~/.claude/plugins
git clone https://github.com/danielraffel/worktree-manager
cd worktree-manager/mcp-server
npm install
npm run build
```

### 2. Configure Claude Code

The plugin is automatically detected. Verify with:

```bash
claude
/help
# Should show worktree-manager commands
```

### 3. Optional: Install Chainer

For automated workflows (planning + implementation):

```bash
git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer
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

## Automated Workflows with Chainer

Worktree Manager creates the environment. **Chainer** handles automated workflows.

### Full Workflow (Plan + Implement)

```bash
# Create worktree
/worktree-manager:start oauth

# Run automated workflow
/chainer:run plan-and-implement \
  --cwd="~/worktrees/oauth" \
  --prompt="Build OAuth2 authentication" \
  --feature_name="oauth"
```

This will:
1. Plan feature with `feature-dev` plugin
2. Implement with `ralph-wiggum` plugin
3. Iterate until complete

### Or Combine in One Step

With Chainer's `worktree-plan-implement` chain (Phase 3):

```bash
/chainer:run worktree-plan-implement \
  --feature_name="oauth" \
  --prompt="Build OAuth2 authentication"
```

## Configuration

Create `~/.claude/worktree-manager.local.md` (global) or `.claude/worktree-manager.local.md` (project-specific):

```yaml
---
worktree_base_path: ~/my-worktrees
branch_prefix: feat/
create_learnings_file: true
---

# Notes
Project-specific configuration notes here.
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `worktree_base_path` | `~/worktrees` | Where to create worktrees |
| `branch_prefix` | `feature/` | Prefix for feature branches |
| `create_learnings_file` | `false` | Auto-create LEARNINGS.md |

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

## Evolution Story

This project evolved through several iterations:

1. **v1**: Bash scripts in Claude Code plugin
2. **v2**: TypeScript with 45 tests (99% coverage)
3. **v2.1**: Added 4 automated workflows (plan-only, implement-only, etc.)
4. **v3 (current)**: Split workflows to **Chainer** plugin
   - Worktree Manager = Pure worktree operations
   - Chainer = Universal plugin orchestration
   - Clean separation of concerns

## Related Projects

- **[Chainer](https://github.com/danielraffel/Chainer)** - Universal plugin orchestration for Claude Code
- **[feature-dev](https://github.com/anthropics/claude-plugins-official/tree/main/feature-dev)** - Feature planning plugin
- **[ralph-wiggum](https://github.com/anthropics/claude-plugins-official/tree/main/ralph-wiggum)** - Iterative implementation plugin

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

- [GitHub](https://github.com/danielraffel/worktree-manager)
- [Chainer Plugin](https://github.com/danielraffel/Chainer)
- [Feature Plan](FEATURE-PLAN-CHAINER-SPLIT.md)
