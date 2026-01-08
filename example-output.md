# Example Output: Multi-Ecosystem Detection

## Scenario 1: Full-Stack Project (Node.js + Python)

User runs: `/worktree-manager:start payments`

**Output:**
```
Worktree created: ~/worktrees/payments/
Branch: feature/payments (from main)
Project type: web

📋 Copied 3 environment file(s)

Running setup commands...
✓ npm install (in web/)
✅ Setup complete

📦 Found multiple project types:
   ✓ Node.js (web) - installed
   • Python (Poetry) - available

💡 Need the other project types? Just run their install commands:
   poetry install

ℹ️  What does this mean? See: https://danielraffel.github.io/worktree-manager/#faq-multiple-languages

✅ Worktree created successfully!
📁 Path: ~/worktrees/payments
🌿 Branch: feature/payments

🔗 Chainer detected! For automated development:

  # Full workflow (plan + implement)
  /chainer:run plan-and-implement \
    --cwd="~/worktrees/payments" \
    --prompt="Your feature idea" \
    --feature_name="payments"

  # Or just planning
  /chainer:run plan-only --cwd="~/worktrees/payments" --prompt="Your idea"

  # Or manual development
  cd ~/worktrees/payments && claude
```

---

## Scenario 2: Monorepo (Node.js + Go + Rust)

User runs: `/worktree-manager:start api-refactor`

**Output:**
```
Worktree created: ~/worktrees/api-refactor/
Branch: feature/api-refactor (from main)
Project type: web

Running setup commands...
✓ npm install
✅ Setup complete

📦 Found multiple project types:
   ✓ Node.js - installed
   • Go - available
   • Rust - available

💡 Need the other project types? Just run their install commands:
   go mod download
   cargo fetch

ℹ️  What does this mean? See: https://danielraffel.github.io/worktree-manager/#faq-multiple-languages

✅ Worktree created successfully!
📁 Path: ~/worktrees/api-refactor
🌿 Branch: feature/api-refactor

Next steps:
  cd ~/worktrees/api-refactor
  claude

💡 For automated workflows, install Chainer:
   git clone https://github.com/danielraffel/Chainer ~/.claude/plugins/chainer

   Then use:
   /chainer:run plan-and-implement --prompt="Your idea" --feature_name="name"
```

---

## Scenario 3: Single Ecosystem (No Extra Message)

User runs: `/worktree-manager:start bug-fix`

**Output:**
```
Worktree created: ~/worktrees/bug-fix/
Branch: feature/bug-fix (from main)
Project type: web

Running setup commands...
✓ npm install
✅ Setup complete

✅ Worktree created successfully!
📁 Path: ~/worktrees/bug-fix
🌿 Branch: feature/bug-fix

Next steps:
  cd ~/worktrees/bug-fix
  claude
```
*(Note: No multi-ecosystem message since only one was detected)*

---

## What the FAQ Shows

When user clicks the link `https://danielraffel.github.io/worktree-manager/#faq-multiple-languages`:

**FAQ Entry (auto-expanded):**

### What does "multiple project types detected" mean?

Worktree Manager scans your project to figure out what it's built with (Node.js, Python, Go, etc.) and automatically runs the setup command. When it detects more than one ecosystem, it picks the first one to install and tells you about the others.

**What we support:** Node.js, Python (Poetry/pip), Ruby, Go, Rust, Java (Maven/Gradle), PHP, Elixir, .NET, Scala, Flutter, Dart, and iOS projects.

**What happens:** We install the first detected ecosystem (like `npm install` for Node.js). If your project has multiple types—common in full-stack projects or monorepos—we show you simple copy/paste commands for the others.

**Why only one?** Running all setups could take 2-5 minutes. By installing just the primary ecosystem (usually 30 seconds), you get started faster. If you need the others, the commands we show work—just run them manually.

**Example output:** If your project has both `package.json` (Node.js) and `pyproject.toml` (Python), we'll run `npm install` first, then show you "`poetry install`" as an available option if you need Python dependencies too.

**What if I don't run the extras?** Your primary ecosystem will work fine. Only run additional commands if you're actively working with that part of your codebase. For example, if you're only editing JavaScript, you don't need Python dependencies installed.
