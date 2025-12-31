# Worktree Manager

**Effortless git worktrees with automated feature development**

A two-layer system combining a Claude Code plugin with an MCP server for parallel feature development using git worktrees.

## What This Does

Create isolated git worktrees for parallel feature development with automatic environment setup and optional integration with Claude Code's `feature-dev` and `ralph-wiggum` plugins for fully automated implementation workflows.

**Quick example**:
```bash
# In Claude Code
/worktree-manager:start my-feature plan-and-implement "Design OAuth2 authentication"
```

This single command:
1. Creates a new git worktree at `~/worktrees/my-feature/`
2. Creates branch `feature/my-feature`
3. Auto-detects and runs environment setup (npm install, etc.)
4. Runs `feature-dev` to generate implementation spec
5. Runs `ralph-wiggum` to automatically implement the spec
6. All automated - come back to a completed feature ready for review

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
│  • Template automation system           │
│  • 4 workflows: simple, plan-only,      │
│    implement-only, plan-and-implement   │
└─────────────────────────────────────────┘
```

### Why Two Layers?

- **Plugin layer**: Provides user-friendly commands and integrates with Claude Code's ecosystem
- **MCP server layer**: Type-safe TypeScript implementation with comprehensive tests
- **Separation of concerns**: UI/UX in plugin, business logic in MCP server
- **Maintainability**: Can update either layer independently

## Evolution Story

This project evolved through several iterations:

1. **v1**: Pure bash scripts in a Claude Code plugin
2. **v2**: TypeScript implementation with 45 tests (99% coverage)
3. **v3**: Recognized architectural mismatch - TypeScript was MCP server, not plugin
4. **v4 (current)**: Proper two-layer architecture with plugin calling MCP server

## Features

### 4 Workflows

1. **Simple** (default) - Manual development
   - Creates worktree with auto-setup
   - Ready for manual coding

2. **Plan-only** - Feature planning
   - Creates worktree
   - Runs `feature-dev` to generate spec

3. **Implement-only** - Automated implementation
   - Creates worktree
   - Runs `ralph-wiggum` with template automation

4. **Plan-and-implement** - Full automation
   - Creates worktree
   - Plans with `feature-dev`
   - Implements with `ralph-wiggum`
   - Fully automated end-to-end

### Auto-Detection

- Detects web projects (package.json) → runs `npm install`
- Detects iOS projects (Package.swift) → runs `swift build`
- Extensible for other project types

### Template Automation

Auto-fills 50-line ralph prompts from simple config:
```bash
--work-on="P0 items" --skip="P2 features"
```

Becomes a complete ralph prompt with:
- Spec file reference
- Work priorities
- Skip instructions
- Context preservation
- Git commit instructions

## Installation

### Prerequisites

- [Claude Code](https://claude.ai/code) installed
- Node.js 18+ (for MCP server)
- Git repository

### Step 1: Install MCP Server

```bash
cd ~/worktree-manager/mcp-server
npm install
npm run build
```

Verify installation:
```bash
npm test  # Should show 45 passing tests
```

### Step 2: Install Plugin

```bash
# Symlink plugin to Claude Code plugins directory
ln -s ~/worktree-manager/plugin ~/.config/claude/plugins/worktree-manager

# Restart Claude Code
```

### Step 3: Verify Installation

In Claude Code:
```bash
/help
```

You should see `worktree-manager:*` commands listed.

## Quick Start

### Basic Usage

**Create a simple worktree**:
```
/worktree-manager:start bug-fix
```

**List all worktrees**:
```
/worktree-manager:list
/worktree-manager:list --status
```

**Check status**:
```
/worktree-manager:status ~/worktrees/bug-fix
```

**Cleanup (merge and remove)**:
```
/worktree-manager:cleanup ~/worktrees/bug-fix --merge
```

### Automated Workflows

**Plan a feature** (generates spec):
```
/worktree-manager:start password-reset plan-only "Design password reset with email verification"
```

**Implement from spec** (automated coding):
```
/worktree-manager:start build-auth implement-only audit/auth-spec.md --work-on="P0 items"
```

**Full automation** (plan + implement):
```
/worktree-manager:start comments plan-and-implement "Add comment system with threading" --work-on="P0" --skip="P2"
```

## Documentation

- **Plugin Layer**: See [plugin/README.md](plugin/README.md)
- **MCP Server Layer**: See [mcp-server/MCP-SERVER-README.md](mcp-server/MCP-SERVER-README.md)
- **Command Reference**: See [plugin/commands/](plugin/commands/)

## Development

### Running Tests

```bash
cd mcp-server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Current test coverage**: 99%+ (45 tests)

### Project Structure

```
worktree-manager/
├── README.md                  # This file
├── mcp-server/                # TypeScript MCP server
│   ├── src/
│   │   ├── index.ts           # MCP server entry point
│   │   ├── tools/             # Worktree tools
│   │   ├── workflows/         # Workflow implementations
│   │   ├── templates/         # Ralph template system
│   │   └── utils/             # Shared utilities
│   ├── tests/                 # Jest tests (99% coverage)
│   ├── package.json
│   ├── tsconfig.json
│   └── MCP-SERVER-README.md
└── plugin/                    # Claude Code plugin
    ├── .claude-plugin/
    │   └── plugin.json        # Plugin manifest
    ├── commands/              # Slash commands
    │   ├── start.md
    │   ├── list.md
    │   ├── status.md
    │   └── cleanup.md
    └── README.md
```

### Adding New Features

1. **Add to MCP server** (`mcp-server/src/tools/`)
   - Implement TypeScript tool
   - Add comprehensive tests
   - Export from `index.ts`

2. **Add to plugin** (`plugin/commands/`)
   - Create command markdown file
   - Document usage and examples
   - Add to allowed-tools in frontmatter

3. **Update documentation**
   - Update READMEs
   - Add examples
   - Update architecture diagrams

## Troubleshooting

### Plugin not showing up

```bash
# Check symlink
ls -la ~/.config/claude/plugins/worktree-manager

# Should point to ~/worktree-manager/plugin
```

### MCP server not responding

```bash
# Rebuild MCP server
cd ~/worktree-manager/mcp-server
npm run build

# Check for errors in build output
```

### Worktree creation fails

Check that:
- You're in a git repository
- Branch name doesn't already exist
- Worktree directory doesn't exist

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## Roadmap

- [ ] Support for additional project types (Python, Ruby, etc.)
- [ ] Custom worktree directory configuration
- [ ] Worktree templates for common workflows
- [ ] Integration with additional Claude Code plugins
- [ ] PR creation workflow

## Author

**Daniel Raffel**
http://danielraffel.me

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built for [Claude Code](https://claude.ai/code)
- Uses [Model Context Protocol (MCP)](https://github.com/anthropics/mcp)
- Inspired by the need for parallel feature development workflows
