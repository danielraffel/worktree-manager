import { SetupCommand } from '../types';
/**
 * Setup command runner
 * Executes project setup commands (npm install, etc.)
 */
export declare class SetupRunner {
    /**
     * Run all setup commands
     */
    static runSetupCommands(commands: SetupCommand[]): Promise<{
        success: boolean;
        messages: string[];
        errors: string[];
    }>;
    /**
     * Run a single setup command
     */
    static runCommand(cmd: SetupCommand): Promise<{
        success: boolean;
        stdout?: string;
        stderr?: string;
        error?: string;
    }>;
}
//# sourceMappingURL=setup-runner.d.ts.map