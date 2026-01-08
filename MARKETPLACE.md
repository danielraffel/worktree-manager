# Worktree Manager Marketplace

This repository serves as both a Claude Code plugin and a plugin marketplace.

## Installation Methods

### Method 1: Direct Plugin Installation (Recommended for Single Users)

Install directly from GitHub:

```bash
/plugin install https://github.com/danielraffel/worktree-manager/tree/main/plugin
```

Or in Claude Code:
1. Type `/plugin`
2. Select "Install from URL"
3. Enter: `https://github.com/danielraffel/worktree-manager/tree/main/plugin`

### Method 2: Via Marketplace (For Teams/Multiple Installations)

Add the marketplace:

```bash
/plugin marketplace add danielraffel/worktree-manager
```

Then install the plugin:

```bash
/plugin install worktree-manager@worktree-manager-marketplace
```

## Prerequisites

Before installing, ensure you have:

1. **Node.js** (v16 or later)
2. **Git** worktree support (Git 2.5+)
3. **Claude Code** installed

## Post-Installation Setup

After installation, build the MCP server:

```bash
cd ~/.claude/plugins/worktree-manager
cd ../mcp-server
npm install
npm run build
```

Or if installed in a project:

```bash
cd .claude-plugin/worktree-manager/mcp-server
npm install
npm run build
```

## Verification

Verify installation:

```bash
/plugin list
```

You should see `worktree-manager` in the list.

Test the plugin:

```bash
/worktree-manager:start test-feature
```

## Available Commands

- `/worktree-manager:start <feature-name>` - Create new worktree with auto-setup
- `/worktree-manager:list` - List all worktrees
- `/worktree-manager:status` - Check worktree status
- `/worktree-manager:cleanup <path>` - Remove worktree safely

## Documentation

- **Homepage**: https://www.generouscorp.com/worktree-manager/
- **GitHub**: https://github.com/danielraffel/worktree-manager
- **Issues**: https://github.com/danielraffel/worktree-manager/issues

## License

MIT License - see [LICENSE](LICENSE) for details
