# Plugin Marketplace Migration Guide

This guide documents how to migrate a Claude Code plugin to use marketplace distribution with zero-dependency installation. Use this as a prompt for AI to apply these changes to other plugins.

---

## AI Prompt: Migrate Plugin to Marketplace with Bundled Dependencies

I need you to migrate my Claude Code plugin to use marketplace distribution with a bundled MCP server (no build steps required for users). Here's what needs to be done:

### Part 1: Repository Restructure

**Current structure** (plugin in subdirectory):
```
my-plugin/
├── plugin/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── commands/
│       └── *.md
└── mcp-server/
    ├── src/
    ├── dist/
    └── package.json
```

**Target structure** (plugin at root):
```
my-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── commands/
│   └── *.md
└── mcp-server/
    ├── src/
    ├── dist/          # Bundled, committed to repo
    └── package.json
```

**Steps**:
1. Move `plugin/.claude-plugin/` → `.claude-plugin/`
2. Move `plugin/commands/` → `commands/`
3. Delete the now-empty `plugin/` directory
4. Update `.claude-plugin/plugin.json` MCP server path from `../mcp-server/dist/index.js` to `mcp-server/dist/index.js`

### Part 2: Create Marketplace Configuration

Create `.claude-plugin/marketplace.json`:

```json
{
  "name": "YOUR-MARKETPLACE-NAME",
  "owner": {
    "name": "Your Name or Org",
    "email": "your-email@example.com"
  },
  "metadata": {
    "description": "Brief description of marketplace",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "your-plugin-name",
      "source": {
        "source": "url",
        "url": "https://github.com/username/repo-name.git"
      },
      "description": "Plugin description",
      "version": "2.0.0",
      "author": {
        "name": "Author Name",
        "url": "https://authorurl.com"
      },
      "homepage": "https://your-plugin-homepage.com",
      "repository": "https://github.com/username/repo-name",
      "license": "MIT",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}
```

**Important**: Use `"source": "url"` with HTTPS GitHub URL (not SSH or GitHub shorthand) to avoid authentication issues.

### Part 3: Bundle MCP Server Dependencies

**Goal**: Create a single self-contained `dist/index.js` with all dependencies bundled (no `node_modules` required at runtime).

**Steps**:

1. **Install esbuild**:
   ```bash
   cd mcp-server
   npm install --save-dev esbuild
   ```

2. **Update `mcp-server/package.json` build script**:
   ```json
   {
     "scripts": {
       "build": "npm run clean && esbuild src/index.ts --bundle --platform=node --format=cjs --outfile=dist/index.js --external:fsevents",
       "clean": "rm -rf dist"
     }
   }
   ```

3. **Build the bundled output**:
   ```bash
   npm run build
   ```

4. **Verify bundling worked**:
   ```bash
   # Test in isolated directory without node_modules
   mkdir /tmp/test-bundle
   cp dist/index.js /tmp/test-bundle/
   cd /tmp/test-bundle
   node index.js
   # Should run without errors
   ```

5. **Update `.gitignore`**:
   ```
   # Build artifacts
   # Note: mcp-server/dist/ is committed for easier plugin installation
   build/
   *.tsbuildinfo
   ```

   Make sure `dist/` is NOT in `.gitignore` - we need to commit the bundled file.

6. **Commit the bundled dist/**:
   ```bash
   git add mcp-server/dist/index.js mcp-server/package.json
   git commit -m "Bundle MCP server with esbuild for zero-dependency installation"
   git push origin main
   ```

**Result**: The bundled `dist/index.js` typically goes from 50+ separate files to a single ~200KB file with all dependencies included.

### Part 4: Update Installation Documentation

**README.md** - Replace manual installation with marketplace steps:

```markdown
## Installation

### 1. Add the Marketplace

In Claude Code, run:

```bash
/plugin marketplace add username/repo-name
```

### 2. Install the Plugin

```bash
/plugin install plugin-name@marketplace-name
```

Or use the interactive installer:
1. Type `/plugin`
2. Navigate to "marketplace-name"
3. Select "plugin-name"
4. Click "Install for you (user scope)"

### 3. Restart Claude Code

Quit and reopen Claude Code to load the plugin.

### 4. Verify Installation

```bash
/plugin list
# Should show plugin-name

/plugin-name:command
# Test a command
```
```

**index.html** - Update installation section:

```html
<span class="code-comment"># 1. Add the marketplace (in Claude Code)</span>
/plugin marketplace add username/repo-name

<span class="code-comment"># 2. Install the plugin</span>
/plugin install plugin-name@marketplace-name

<span class="code-comment"># 3. Restart Claude Code</span>
<span class="code-comment"># Quit and reopen Claude Code to load the plugin</span>
```

**Update FAQ** (if applicable) - Remove `--plugin-dir` references, explain marketplace installation instead.

### Part 5: Clean Up Plugin Manifest

Remove unsupported fields from `.claude-plugin/plugin.json`:

```json
{
  "name": "plugin-name",
  "version": "2.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Author Name",
    "url": "https://authorurl.com"
  },
  "homepage": "https://homepage.com",
  "repository": "https://github.com/username/repo",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": "./commands/",
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Remove these unsupported fields** if present:
- `category` (not supported)
- Any custom fields not in the official schema

### Part 6: Testing Checklist

After making all changes:

- [ ] Build bundled MCP server: `cd mcp-server && npm run build`
- [ ] Verify bundle works standalone (test without node_modules)
- [ ] Commit and push bundled `dist/index.js`
- [ ] Test marketplace installation:
  - `/plugin marketplace add username/repo-name`
  - `/plugin install plugin-name@marketplace-name`
  - Restart Claude Code
  - `/plugin list` (should show your plugin)
  - Test a command to verify MCP server connects
- [ ] Verify no build steps required for users
- [ ] Check that installation docs are updated everywhere (README.md, index.html, etc.)

---

## Example: Chainer Plugin Migration

For the **Chainer** plugin using the existing `danielraffel/worktree-manager` marketplace:

### Marketplace Configuration

Since Chainer will use the existing worktree-manager marketplace, update `.claude-plugin/marketplace.json` to add Chainer as a second plugin:

```json
{
  "name": "generous-corp-marketplace",
  "owner": {
    "name": "Generous Corp",
    "email": "dev@generouscorp.com"
  },
  "metadata": {
    "description": "Git worktree management tools for Claude Code",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "worktree-manager",
      "source": {
        "source": "url",
        "url": "https://github.com/danielraffel/worktree-manager.git"
      },
      "description": "Effortless git worktrees for parallel development with automatic environment setup",
      "version": "2.0.0",
      "author": {
        "name": "Daniel Raffel",
        "url": "https://danielraffel.me"
      },
      "homepage": "https://www.generouscorp.com/worktree-manager/",
      "repository": "https://github.com/danielraffel/worktree-manager",
      "license": "MIT",
      "keywords": ["git", "worktree", "version-control", "productivity", "parallel-development"]
    },
    {
      "name": "chainer",
      "source": {
        "source": "url",
        "url": "https://github.com/danielraffel/chainer.git"
      },
      "description": "Universal plugin orchestration for Claude Code",
      "version": "2.0.0",
      "author": {
        "name": "Daniel Raffel",
        "url": "https://danielraffel.me"
      },
      "homepage": "https://www.generouscorp.com/Chainer/",
      "repository": "https://github.com/danielraffel/chainer",
      "license": "MIT",
      "keywords": ["orchestration", "workflow", "automation", "plugin-orchestration"]
    }
  ]
}
```

### Installation for Chainer Users

```bash
# Add marketplace (if not already added)
/plugin marketplace add danielraffel/worktree-manager

# Install Chainer
/plugin install chainer@generous-corp-marketplace

# Restart Claude Code
```

---

## Common Issues and Fixes

### Issue 1: MCP Server Falls Back to Bash
**Symptom**: Commands execute via bash instead of MCP tools.

**Fix**: User needs to update the marketplace and reinstall:
```bash
/plugin marketplace update
/plugin uninstall plugin-name@marketplace-name
/plugin install plugin-name@marketplace-name
# Restart Claude Code
```

### Issue 2: "Permission denied (publickey)" on Install
**Symptom**: Git clone fails with SSH authentication error.

**Fix**: Use HTTPS URL in marketplace.json source:
```json
{
  "source": {
    "source": "url",
    "url": "https://github.com/username/repo.git"
  }
}
```
NOT GitHub shorthand or SSH URLs.

### Issue 3: "Unrecognized key: category"
**Symptom**: Plugin validation error on install.

**Fix**: Remove unsupported `category` field from `plugin.json`.

### Issue 4: Bundle Still Requires node_modules
**Symptom**: MCP server fails with "Cannot find module" errors.

**Fix**: Verify esbuild is bundling correctly:
- Check build script has `--bundle` flag
- Verify `--external:fsevents` is included (macOS compatibility)
- Test bundle in isolated directory without node_modules
- Rebuild and commit new bundle

---

## File Checklist

After migration, verify these files are updated:

- [ ] `.claude-plugin/plugin.json` - MCP server path updated, unsupported fields removed
- [ ] `.claude-plugin/marketplace.json` - Created with HTTPS URL
- [ ] `commands/` - Moved to repository root
- [ ] `mcp-server/package.json` - Build script uses esbuild bundler
- [ ] `mcp-server/dist/index.js` - Bundled and committed to repository
- [ ] `.gitignore` - dist/ NOT ignored
- [ ] `README.md` - Installation uses marketplace steps
- [ ] `index.html` - Installation section updated
- [ ] `CLAUDE.md` or similar - Documents bundling approach for developers

---

## Summary

**What changed**:
1. Plugin files moved from subdirectory to repository root
2. MCP server dependencies bundled into single file with esbuild
3. Bundled `dist/index.js` committed to repository (not ignored)
4. Marketplace configuration created for distribution
5. Installation documentation updated to use marketplace

**User benefit**:
- Zero build steps required
- No `npm install` needed
- Single command installation via marketplace
- Restart and use immediately

**Developer workflow**:
- Development: Normal TypeScript workflow in `mcp-server/src/`
- Build: `npm run build` creates bundled `dist/index.js`
- Commit: Commit bundled dist/ to repository
- Distribution: Users install directly from marketplace

---

Use this guide as a template to migrate any Claude Code plugin to marketplace distribution with bundled dependencies.
