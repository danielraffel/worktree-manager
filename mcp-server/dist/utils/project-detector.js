"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Project detection utility
 * Detects project type (web/iOS/full-stack) and determines setup commands
 */
class ProjectDetector {
    /**
     * Detect project type and return setup commands
     */
    static detect(worktreePath) {
        const hasWeb = this.hasWebProject(worktreePath);
        const hasIos = this.hasIosProject(worktreePath);
        const hasRootPackageJson = this.hasRootPackageJson(worktreePath);
        let type;
        if (hasWeb && hasIos) {
            type = 'full-stack';
        }
        else if (hasWeb) {
            type = 'web';
        }
        else if (hasIos) {
            type = 'ios';
        }
        else {
            type = 'unknown';
        }
        const setupCommands = this.getSetupCommands({
            worktreePath,
            hasWeb,
            hasIos,
            hasRootPackageJson,
        });
        return {
            type,
            setup_commands: setupCommands,
            details: {
                has_web: hasWeb,
                has_ios: hasIos,
                has_root_package_json: hasRootPackageJson,
            },
        };
    }
    /**
     * Check if project has web/ directory with package.json
     */
    static hasWebProject(worktreePath) {
        const webPackageJson = path.join(worktreePath, 'web', 'package.json');
        return fs.existsSync(webPackageJson);
    }
    /**
     * Check if project has ios/ directory
     */
    static hasIosProject(worktreePath) {
        const iosDir = path.join(worktreePath, 'ios');
        return fs.existsSync(iosDir) && fs.statSync(iosDir).isDirectory();
    }
    /**
     * Check if project has package.json at root
     */
    static hasRootPackageJson(worktreePath) {
        const rootPackageJson = path.join(worktreePath, 'package.json');
        return fs.existsSync(rootPackageJson);
    }
    /**
     * Generate setup commands based on detected project structure
     */
    static getSetupCommands(params) {
        const commands = [];
        // Web project setup
        if (params.hasWeb) {
            commands.push({
                directory: path.join(params.worktreePath, 'web'),
                command: 'npm install',
                description: 'Install web dependencies',
            });
        }
        // Root package.json setup (if exists and no web/)
        if (params.hasRootPackageJson && !params.hasWeb) {
            commands.push({
                directory: params.worktreePath,
                command: 'npm install',
                description: 'Install dependencies',
            });
        }
        // iOS project setup (note: usually manual in Xcode)
        if (params.hasIos && !params.hasWeb) {
            commands.push({
                directory: params.worktreePath,
                command: 'echo "iOS project detected. Open in Xcode if needed."',
                description: 'iOS project setup (manual)',
            });
        }
        return commands;
    }
}
exports.ProjectDetector = ProjectDetector;
//# sourceMappingURL=project-detector.js.map