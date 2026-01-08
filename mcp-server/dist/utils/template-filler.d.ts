/**
 * Template filler for ralph prompts
 * Fills placeholders like {{SOURCE_FILE}} and {{WORK_ON_RULES}}
 */
export declare class TemplateFiller {
    /**
     * Generate work-on rules from user's simple inputs
     */
    static generateWorkOnRules(params: {
        work_on?: string[];
        skip_items?: string[];
    }): string;
    /**
     * Fill ralph template with actual values
     */
    static fillTemplate(params: {
        template_name?: string;
        source_file: string;
        work_on?: string[];
        skip_items?: string[];
    }): string;
    /**
     * Escape a string for safe use in shell commands using $'...' syntax
     */
    static escapeForShell(str: string): string;
    /**
     * Build ralph command with filled template
     */
    static buildRalphCommand(params: {
        template_name?: string;
        source_file: string;
        work_on?: string[];
        skip_items?: string[];
        max_iterations?: number;
    }): string;
}
//# sourceMappingURL=template-filler.d.ts.map