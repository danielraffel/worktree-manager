#!/usr/bin/env node
/**
 * MCP Server for Git Worktree Management
 * Exposes worktree operations as MCP tools for Claude Code
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { WorktreeStartTool } from './tools/worktree-start.js';
import { WorktreeListTool } from './tools/worktree-list.js';
import { WorktreeStatusTool } from './tools/worktree-status.js';
import { WorktreeCleanupTool } from './tools/worktree-cleanup.js';

// Define MCP tools
const TOOLS: Tool[] = [
  {
    name: 'worktree_start',
    description:
      'Create git worktree with auto-setup and optional plugin integration. Supports 4 workflows: simple (manual), plan-only (feature-dev), implement-only (ralph), plan-and-implement (full automation). Auto-runs npm install, detects web/iOS projects, supports background execution.',
    inputSchema: {
      type: 'object',
      properties: {
        feature_name: {
          type: 'string',
          description: 'Name of the feature (becomes feature/<name> branch)',
        },
        base_branch: {
          type: 'string',
          description: 'Branch to branch from (default: main)',
        },
        task_description: {
          type: 'string',
          description: 'Optional context about what you are building',
        },
        worktree_path: {
          type: 'string',
          description: 'Custom worktree path (default: ~/snapguide-worktrees/<feature-name>)',
        },
        workflow: {
          type: 'string',
          enum: ['simple', 'plan-only', 'implement-only', 'plan-and-implement'],
          description: 'Workflow type (default: simple)',
        },
        plan_config: {
          type: 'object',
          description: 'Configuration for feature-dev plugin (required for plan-only and plan-and-implement)',
          properties: {
            prompt: {
              type: 'string',
              description: 'What to plan with feature-dev',
            },
            save_to: {
              type: 'string',
              description: 'Where to save spec (default: audit/<feature-name>.md)',
            },
          },
        },
        ralph_config: {
          type: 'object',
          description: 'Configuration for ralph-wiggum plugin (required for implement-only and plan-and-implement)',
          properties: {
            source_file: {
              type: 'string',
              description: 'Spec file to implement from',
            },
            work_on: {
              type: 'array',
              items: { type: 'string' },
              description: 'What to work on (e.g., ["Phase 6", "P0 items"])',
            },
            skip_items: {
              type: 'array',
              items: { type: 'string' },
              description: 'What to skip (e.g., ["Phase 7", "P2 items"])',
            },
            max_iterations: {
              type: 'number',
              description: 'Max iterations for ralph (default: 50)',
            },
            template: {
              type: 'string',
              description: 'Ralph template to use (default: "default")',
            },
            execution_mode: {
              type: 'string',
              enum: ['manual', 'background', 'interactive'],
              description: 'How to run ralph (default: background)',
            },
          },
        },
      },
      required: ['feature_name'],
    },
  },
  {
    name: 'worktree_list',
    description:
      'List all active git worktrees with optional status information (uncommitted changes, untracked files, ahead/behind remote)',
    inputSchema: {
      type: 'object',
      properties: {
        include_status: {
          type: 'boolean',
          description: 'Include detailed status for each worktree (default: false)',
        },
      },
    },
  },
  {
    name: 'worktree_status',
    description:
      'Get detailed status of a specific worktree including branch name, uncommitted changes, untracked files, and remote tracking status',
    inputSchema: {
      type: 'object',
      properties: {
        worktree_path: {
          type: 'string',
          description: 'Path to the worktree to check',
        },
      },
      required: ['worktree_path'],
    },
  },
  {
    name: 'worktree_cleanup',
    description:
      'Safely merge worktree changes to target branch (default: main) and remove worktree. Optionally auto-merge and delete feature branch. Prevents data loss by checking for uncommitted changes.',
    inputSchema: {
      type: 'object',
      properties: {
        worktree_path: {
          type: 'string',
          description: 'Path to the worktree to clean up',
        },
        auto_merge: {
          type: 'boolean',
          description: 'Automatically merge to target branch before removing (default: false)',
        },
        target_branch: {
          type: 'string',
          description: 'Branch to merge into (default: main)',
        },
        force: {
          type: 'boolean',
          description: 'Force remove even with uncommitted changes (default: false)',
        },
        delete_branch: {
          type: 'boolean',
          description: 'Delete feature branch after merge (default: true)',
        },
      },
      required: ['worktree_path'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'worktree-manager',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'worktree_start': {
        const result = await WorktreeStartTool.execute(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'worktree_list': {
        const result = await WorktreeListTool.execute(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'worktree_status': {
        const result = await WorktreeStatusTool.execute(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'worktree_cleanup': {
        const result = await WorktreeCleanupTool.execute(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message || 'Unknown error',
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Worktree Manager MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
