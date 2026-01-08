"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateFiller = void 0;
const ralph_default_1 = require("../templates/ralph-default");
/**
 * Template filler for ralph prompts
 * Fills placeholders like {{SOURCE_FILE}} and {{WORK_ON_RULES}}
 */
class TemplateFiller {
    /**
     * Generate work-on rules from user's simple inputs
     */
    static generateWorkOnRules(params) {
        const rules = [];
        if (params.work_on && params.work_on.length > 0) {
            params.work_on.forEach((item) => {
                rules.push(`- Work on ${item}`);
            });
        }
        if (params.skip_items && params.skip_items.length > 0) {
            params.skip_items.forEach((item) => {
                rules.push(`- DO NOT work on ${item}`);
            });
        }
        return rules.length > 0 ? '\n' + rules.join('\n') : '';
    }
    /**
     * Fill ralph template with actual values
     */
    static fillTemplate(params) {
        // Get template (default to 'default')
        const templateName = params.template_name || 'default';
        const template = ralph_default_1.RALPH_TEMPLATES[templateName];
        if (!template) {
            throw new Error(`Template '${templateName}' not found. Available: ${Object.keys(ralph_default_1.RALPH_TEMPLATES).join(', ')}`);
        }
        // Generate work-on rules
        const workOnRules = this.generateWorkOnRules({
            work_on: params.work_on,
            skip_items: params.skip_items,
        });
        // Fill placeholders
        let filled = template;
        filled = filled.replace(/\{\{SOURCE_FILE\}\}/g, params.source_file);
        filled = filled.replace(/\{\{WORK_ON_RULES\}\}/g, workOnRules);
        return filled;
    }
    /**
     * Escape a string for safe use in shell commands using $'...' syntax
     */
    static escapeForShell(str) {
        return str
            .replace(/\\/g, '\\\\') // backslash
            .replace(/'/g, "\\'") // single quote
            .replace(/"/g, '\\"') // double quote
            .replace(/`/g, '\\`') // backtick (command substitution)
            .replace(/\$/g, '\\$') // dollar sign (variable expansion)
            .replace(/!/g, '\\!') // exclamation (history expansion)
            .replace(/\n/g, '\\n') // newline
            .replace(/\r/g, '\\r') // carriage return
            .replace(/\t/g, '\\t'); // tab
    }
    /**
     * Build ralph command with filled template
     */
    static buildRalphCommand(params) {
        const filledTemplate = this.fillTemplate({
            template_name: params.template_name,
            source_file: params.source_file,
            work_on: params.work_on,
            skip_items: params.skip_items,
        });
        const maxIterations = params.max_iterations || 50;
        // Escape template for shell using $'...' syntax
        const escapedTemplate = this.escapeForShell(filledTemplate);
        return `claude skill ralph-wiggum:ralph-loop $'${escapedTemplate}' --completion-promise "DONE" --max-iterations ${maxIterations}`;
    }
}
exports.TemplateFiller = TemplateFiller;
//# sourceMappingURL=template-filler.js.map