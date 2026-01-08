"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupRunner = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Setup command runner
 * Executes project setup commands (npm install, etc.)
 */
class SetupRunner {
    /**
     * Run all setup commands
     */
    static async runSetupCommands(commands) {
        const messages = [];
        const errors = [];
        for (const cmd of commands) {
            try {
                messages.push(`Running: ${cmd.description} (${cmd.command})`);
                const { stdout, stderr } = await execAsync(cmd.command, {
                    cwd: cmd.directory,
                    // Timeout after 5 minutes
                    timeout: 5 * 60 * 1000,
                });
                if (stdout) {
                    messages.push(`✅ ${cmd.description} complete`);
                }
                if (stderr && !stderr.includes('npm WARN')) {
                    // Only log stderr if it's not just npm warnings
                    messages.push(`⚠️  ${cmd.description} had warnings: ${stderr.substring(0, 100)}`);
                }
            }
            catch (error) {
                errors.push(`❌ ${cmd.description} failed: ${error.message}`);
                return {
                    success: false,
                    messages,
                    errors,
                };
            }
        }
        return {
            success: true,
            messages,
            errors,
        };
    }
    /**
     * Run a single setup command
     */
    static async runCommand(cmd) {
        try {
            const { stdout, stderr } = await execAsync(cmd.command, {
                cwd: cmd.directory,
                timeout: 5 * 60 * 1000,
            });
            return {
                success: true,
                stdout,
                stderr,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
exports.SetupRunner = SetupRunner;
//# sourceMappingURL=setup-runner.js.map