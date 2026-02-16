/**
 * Input validation utilities for security
 */
export class InputValidator {
    /**
     * Validate file path to prevent path traversal attacks
     */
    static validateFilePath(path: string): void {
        if (!path || typeof path !== 'string') {
            throw new Error('Invalid file path: path must be a non-empty string');
        }

        // Check for path traversal attempts
        if (path.includes('..') || path.startsWith('/')) {
            throw new Error('Invalid file path: path traversal not allowed');
        }

        // Check for null bytes
        if (path.includes('\0')) {
            throw new Error('Invalid file path: null bytes not allowed');
        }
    }

    /**
     * Validate multiple file paths
     */
    static validateFilePaths(paths: string[]): void {
        if (!Array.isArray(paths)) {
            throw new Error('Invalid file paths: must be an array');
        }

        paths.forEach((path) => this.validateFilePath(path));
    }

    /**
     * Validate branch name according to Git rules
     */
    static validateBranchName(name: string): void {
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid branch name: must be a non-empty string');
        }

        // Git branch name rules
        const invalidPatterns = [
            /^\./, // Cannot start with .
            /^-/, // Cannot start with -
            /\.\./, // Cannot contain ..
            /[\x00-\x1f\x7f]/, // No control characters
            /\s/, // No whitespace
            /[~^:?*\[\\]/, // No special chars
            /@\{/, // No @{
            /\/$/, // Cannot end with /
            /\.lock$/, // Cannot end with .lock
            /\/\//, // No consecutive slashes
        ];

        for (const pattern of invalidPatterns) {
            if (pattern.test(name)) {
                throw new Error(`Invalid branch name: '${name}' violates Git naming rules`);
            }
        }
    }

    /**
     * Sanitize commit message to prevent command injection
     */
    static sanitizeCommitMessage(message: string): string {
        if (!message || typeof message !== 'string') {
            throw new Error('Invalid commit message: must be a non-empty string');
        }

        // Remove null bytes
        let sanitized = message.replace(/\0/g, '');

        // Escape backticks, dollar signs, and backslashes for shell safety
        sanitized = sanitized.replace(/[`$\\]/g, '\\$&');

        return sanitized;
    }

    /**
     * Validate commit hash or ref (branch name, tag, etc.)
     * More lenient than validateCommitHash as it accepts refs
     */
    static validateCommitRef(ref: string): void {
        if (!ref || typeof ref !== 'string') {
            throw new Error('Invalid commit ref: must be a non-empty string');
        }

        // Check for null bytes and other dangerous characters
        if (ref.includes('\0') || ref.includes('..')) {
            throw new Error(`Invalid commit ref: '${ref}' contains invalid characters`);
        }
    }

    /**
     * Validate multiple commit refs
     */
    static validateCommitRefs(refs: string[]): void {
        if (!Array.isArray(refs)) {
            throw new Error('Invalid commit refs: must be an array');
        }

        refs.forEach((ref) => this.validateCommitRef(ref));
    }

    /**
     * Validate commit hash
     */
    static validateCommitHash(hash: string): void {
        if (!hash || typeof hash !== 'string') {
            throw new Error('Invalid commit hash: must be a non-empty string');
        }

        // Git commit hashes are 7-40 hex characters
        if (!/^[0-9a-f]{7,40}$/i.test(hash)) {
            throw new Error(`Invalid commit hash: '${hash}' is not a valid Git hash`);
        }
    }

    /**
     * Validate multiple commit hashes
     */
    static validateCommitHashes(hashes: string[]): void {
        if (!Array.isArray(hashes)) {
            throw new Error('Invalid commit hashes: must be an array');
        }

        hashes.forEach((hash) => this.validateCommitHash(hash));
    }

    /**
     * Validate remote name
     */
    static validateRemoteName(name: string): void {
        if (!name || typeof name !== 'string') {
            throw new Error('Invalid remote name: must be a non-empty string');
        }

        // Remote names should be simple alphanumeric with hyphens/underscores
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            throw new Error(`Invalid remote name: '${name}' contains invalid characters`);
        }
    }

    /**
     * Validate stash index
     */
    static validateStashIndex(index: number): void {
        if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
            throw new Error('Invalid stash index: must be a non-negative integer');
        }
    }
}
