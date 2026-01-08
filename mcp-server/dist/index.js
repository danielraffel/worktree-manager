#!/usr/bin/env node
"use strict";
/**
 * MCP Server for Git Worktree Management
 * Exposes worktree operations as MCP tools for Claude Code
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const worktree_start_js_1 = require("./tools/worktree-start.js");
const worktree_list_js_1 = require("./tools/worktree-list.js");
const worktree_status_js_1 = require("./tools/worktree-status.js");
const worktree_cleanup_js_1 = require("./tools/worktree-cleanup.js");
// Define MCP tools
const TOOLS = [
    {
        name: 'worktree_start',
        description: 'Create git worktree with auto-setup. Pure worktree operations - creates isolated workspace with automatic project detection and setup (npm install for web, swift build for iOS). For automated workflows, use Chainer plugin.',
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
                    description: 'Custom worktree path (default: ~/worktrees/<feature-name>)',
                },
            },
            required: ['feature_name'],
        },
    },
    {
        name: 'worktree_list',
        description: 'List all active git worktrees with optional status information (uncommitted changes, untracked files, ahead/behind remote)',
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
        description: 'Get detailed status of a specific worktree including branch name, uncommitted changes, untracked files, and remote tracking status',
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
        description: 'Safely merge worktree changes to target branch (default: main) and remove worktree. Optionally auto-merge and delete feature branch. Prevents data loss by checking for uncommitted changes.',
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
const server = new index_js_1.Server({
    name: 'worktree-manager',
    version: '2.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Handle tool listing
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});
// Handle tool execution
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'worktree_start': {
                const result = await worktree_start_js_1.WorktreeStartTool.execute(args);
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
                const result = await worktree_list_js_1.WorktreeListTool.execute(args);
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
                const result = await worktree_status_js_1.WorktreeStatusTool.execute(args);
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
                const result = await worktree_cleanup_js_1.WorktreeCleanupTool.execute(args);
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message || 'Unknown error',
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Worktree Manager MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map