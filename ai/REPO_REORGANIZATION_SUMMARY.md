# Repository Reorganization Summary

This document summarizes the changes made to migrate worktree-manager to marketplace distribution with bundled dependencies.

## 1. Repository Restructure

### Before
```
worktree-manager/
├── plugin/
│   ├── .claude-plugin/plugin.json
│   └── commands/*.md
└── mcp-server/
    ├── src/
    ├── dist/           # 50+ separate .js/.d.ts files, NOT committed
    └── package.json
```

### After
```
worktree-manager/
├── .claude-plugin/
│   ├── plugin.json     # Updated MCP path
│   └── marketplace.json # NEW
├── commands/*.md
└── mcp-server/
    ├── src/
    ├── dist/
    │   └── index.js    # Single 198KB bundled file, COMMITTED
    └── package.json    # esbuild build script
```

### Changes Made
- Moved `.claude-plugin/` from `plugin/` to root
- Moved `commands/` from `plugin/` to root
- Deleted `plugin/` directory
- Updated `plugin.json` MCP server path: `../mcp-server/dist/index.js` → `mcp-server/dist/index.js`

## 2. MCP Server Bundling

### Before
```bash
# Separate compiled files
mcp-server/dist/
├── index.js
├── index.d.ts
├── tools/
│   ├── worktree-start.js
│   ├── worktree-list.js
│   └── ...
└── utils/
    ├── git-helpers.js
    └── ...

# Required node_modules at runtime
# Users needed to: npm install && npm run build
```

### After
```bash
# Single bundled file
mcp-server/dist/
└── index.js  # 198KB, all dependencies included

# No node_modules required
# Users install directly from marketplace
```

### Changes Made

**1. Installed esbuild**:
```bash
npm install --save-dev esbuild
```

**2. Updated build script** in `mcp-server/package.json`:
```json
{
  "scripts": {
    "build": "npm run clean && esbuild src/index.ts --bundle --platform=node --format=cjs --outfile=dist/index.js --external:fsevents"
  }
}
```

**3. Updated .gitignore**:
```diff
# Build artifacts
-dist/
+# Note: mcp-server/dist/ is committed for easier plugin installation
build/
*.tsbuildinfo
```

**4. Built and committed bundle**:
```bash
cd mcp-server
npm run build
git add dist/index.js
git commit -m "Bundle MCP server with esbuild"
```

## 3. Marketplace Configuration

### Created `.claude-plugin/marketplace.json`

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
      "description": "Effortless git worktrees for parallel development",
      "version": "2.0.0",
      "author": {
        "name": "Daniel Raffel",
        "url": "https://danielraffel.me"
      },
      "homepage": "https://www.generouscorp.com/worktree-manager/",
      "repository": "https://github.com/danielraffel/worktree-manager",
      "license": "MIT",
      "keywords": ["git", "worktree", "version-control", "productivity"]
    }
  ]
}
```

**Key Decision**: Used `"source": "url"` with HTTPS (not SSH or GitHub shorthand) to avoid authentication issues.

## 4. Installation Documentation Updates

### Before (Manual Installation)

**README.md**:
```markdown
## Installation

1. Clone the repository
2. Build the MCP server:
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```
3. Start Claude Code with plugin directory:
   ```bash
   claude --plugin-dir=/path/to/worktree-manager/plugin
   ```
```

**index.html**:
```html
<pre><code>git clone https://github.com/danielraffel/worktree-manager.git
cd worktree-manager/mcp-server
npm install
npm run build
claude --plugin-dir=../plugin
</code></pre>
```

### After (Marketplace Installation)

**README.md**:
```markdown
## Installation

### 1. Add the Marketplace

```bash
/plugin marketplace add danielraffel/generous-corp-marketplace
```

### 2. Install the Plugin

```bash
/plugin install worktree-manager@generous-corp-marketplace
```

### 3. Restart Claude Code

### 4. Verify Installation

```bash
/plugin list
/worktree-manager:list
```
```

**index.html**:
```html
<pre><code><span class="code-comment"># 1. Add the marketplace (in Claude Code)</span>
/plugin marketplace add danielraffel/generous-corp-marketplace

<span class="code-comment"># 2. Install the plugin</span>
/plugin install worktree-manager@generous-corp-marketplace

<span class="code-comment"># 3. Restart Claude Code</span>
</code></pre>
```

### FAQ Updates

**Before**:
```
Q: How do I install plugins?
A: Use the --plugin-dir flag when starting Claude Code
```

**After**:
```
Q: How do I install plugins?
A: Use the marketplace system:
   1. /plugin marketplace add danielraffel/generous-corp-marketplace
   2. /plugin install plugin-name@generous-corp-marketplace
   3. Restart Claude Code
```

## 5. Key Benefits

### For Users
- **Zero build steps**: No `npm install` or `npm run build` required
- **One-command install**: Single marketplace command
- **Auto-updates**: `/plugin marketplace update` pulls latest changes
- **No dependencies**: No node_modules directory needed

### For Developers
- **Standard workflow**: Develop in TypeScript as usual
- **Single build command**: `npm run build` creates bundle
- **Automatic distribution**: Push to GitHub, users get updates via marketplace
- **Better testing**: Can test bundle in isolation without node_modules

## 6. Common Issues Solved

### Issue 1: SSH Authentication Errors
**Problem**: `git@github.com: Permission denied (publickey)`

**Solution**: Used HTTPS URL in marketplace.json:
```json
{
  "source": {
    "source": "url",
    "url": "https://github.com/danielraffel/worktree-manager.git"
  }
}
```

### Issue 2: Plugin Files Not Found
**Problem**: Marketplace cloned repo but plugin files were in `plugin/` subdirectory

**Solution**: Moved plugin files to repository root

### Issue 3: MCP Server Fallback to Bash
**Problem**: Commands used bash instead of MCP server tools

**Solution**: Bundled dependencies so MCP server doesn't need node_modules at runtime

### Issue 4: Category Validation Error
**Problem**: `Unrecognized key: "category"`

**Solution**: Removed unsupported `category` field from plugin.json

## 7. File Changes Checklist

- [x] `.claude-plugin/plugin.json` - Updated MCP server path, removed unsupported fields
- [x] `.claude-plugin/marketplace.json` - Created
- [x] `commands/` - Moved to repository root
- [x] `mcp-server/package.json` - Added esbuild, updated build script
- [x] `mcp-server/dist/index.js` - Bundled and committed
- [x] `.gitignore` - Removed dist/ from ignore list
- [x] `README.md` - Updated installation section
- [x] `index.html` - Updated installation section
- [x] `CLAUDE.md` - Documented bundling approach

## 8. Testing Verification

### Build Test
```bash
cd mcp-server
npm run build
# Should create single dist/index.js (~198KB)
```

### Standalone Test
```bash
mkdir /tmp/test-bundle
cp mcp-server/dist/index.js /tmp/test-bundle/
cd /tmp/test-bundle
node index.js
# Should start MCP server without errors
```

### Installation Test
```bash
# In Claude Code:
/plugin marketplace add danielraffel/generous-corp-marketplace
/plugin install worktree-manager@generous-corp-marketplace
# Restart Claude Code
/plugin list
# Should show: worktree-manager
/worktree-manager:list
# Should connect to MCP server (not fall back to bash)
```

## 9. Git Commits Summary

1. **Repository restructure**:
   ```
   Move plugin files from subdirectory to repository root
   - Move .claude-plugin/ to root
   - Move commands/ to root
   - Update plugin.json MCP server path
   ```

2. **Marketplace setup**:
   ```
   Add marketplace configuration for plugin distribution
   - Create .claude-plugin/marketplace.json
   - Use HTTPS URL for source
   ```

3. **Dependency bundling**:
   ```
   Bundle MCP server with esbuild for zero-dependency installation
   - Install esbuild
   - Update build script
   - Commit bundled dist/index.js
   - Update .gitignore
   ```

4. **Documentation updates**:
   ```
   Update installation docs to use marketplace
   - Update README.md installation section
   - Update index.html installation section
   - Remove --plugin-dir references
   ```

## 10. Maintenance Workflow

### Development
```bash
# Make changes in mcp-server/src/
cd mcp-server
npm test
npm run build
```

### Release
```bash
# Commit bundled output
git add mcp-server/dist/index.js
git commit -m "Update bundled MCP server"
git push origin main
```

### User Update
```bash
# Users get updates via marketplace
/plugin marketplace update
/plugin install worktree-manager@generous-corp-marketplace
# Restart Claude Code
```

---

**Result**: Transformed from manual multi-step installation to single-command marketplace installation with zero dependencies.
