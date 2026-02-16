import { describe, it, expect } from 'vitest';
import { InputValidator } from './InputValidator';

describe('InputValidator', () => {
    describe('validateFilePath', () => {
        it('should accept valid file paths', () => {
            expect(() => InputValidator.validateFilePath('src/file.ts')).not.toThrow();
            expect(() =>
                InputValidator.validateFilePath('folder/subfolder/file.txt')
            ).not.toThrow();
            expect(() => InputValidator.validateFilePath('file.txt')).not.toThrow();
        });

        it('should reject path traversal attempts', () => {
            expect(() => InputValidator.validateFilePath('../etc/passwd')).toThrow(
                'path traversal'
            );
            expect(() => InputValidator.validateFilePath('../../file.txt')).toThrow(
                'path traversal'
            );
            expect(() => InputValidator.validateFilePath('folder/../../../etc')).toThrow(
                'path traversal'
            );
        });

        it('should reject absolute paths', () => {
            expect(() => InputValidator.validateFilePath('/etc/passwd')).toThrow('path traversal');
            expect(() => InputValidator.validateFilePath('/home/user/file')).toThrow(
                'path traversal'
            );
        });

        it('should reject null bytes', () => {
            expect(() => InputValidator.validateFilePath('file\0.txt')).toThrow('null bytes');
        });

        it('should reject empty or invalid paths', () => {
            expect(() => InputValidator.validateFilePath('')).toThrow('non-empty string');
            expect(() => InputValidator.validateFilePath(null as any)).toThrow('non-empty string');
            expect(() => InputValidator.validateFilePath(undefined as any)).toThrow(
                'non-empty string'
            );
        });
    });

    describe('validateFilePaths', () => {
        it('should accept valid file paths array', () => {
            expect(() =>
                InputValidator.validateFilePaths(['file1.txt', 'file2.txt'])
            ).not.toThrow();
        });

        it('should reject invalid arrays', () => {
            expect(() => InputValidator.validateFilePaths(null as any)).toThrow('must be an array');
            expect(() => InputValidator.validateFilePaths('not-array' as any)).toThrow(
                'must be an array'
            );
        });

        it('should reject arrays with invalid paths', () => {
            expect(() => InputValidator.validateFilePaths(['valid.txt', '../invalid'])).toThrow();
        });
    });

    describe('validateBranchName', () => {
        it('should accept valid branch names', () => {
            expect(() => InputValidator.validateBranchName('main')).not.toThrow();
            expect(() => InputValidator.validateBranchName('feature/new-feature')).not.toThrow();
            expect(() => InputValidator.validateBranchName('bugfix-123')).not.toThrow();
            expect(() => InputValidator.validateBranchName('release_v1.0')).not.toThrow();
        });

        it('should reject branch names starting with dot', () => {
            expect(() => InputValidator.validateBranchName('.hidden')).toThrow('naming rules');
        });

        it('should reject branch names with double dots', () => {
            expect(() => InputValidator.validateBranchName('feature..test')).toThrow(
                'naming rules'
            );
        });

        it('should reject branch names with special characters', () => {
            expect(() => InputValidator.validateBranchName('feature~1')).toThrow('naming rules');
            expect(() => InputValidator.validateBranchName('feature^1')).toThrow('naming rules');
            expect(() => InputValidator.validateBranchName('feature:test')).toThrow('naming rules');
            expect(() => InputValidator.validateBranchName('feature?')).toThrow('naming rules');
            expect(() => InputValidator.validateBranchName('feature*')).toThrow('naming rules');
            expect(() => InputValidator.validateBranchName('feature[test]')).toThrow(
                'naming rules'
            );
        });

        it('should reject branch names ending with slash', () => {
            expect(() => InputValidator.validateBranchName('feature/')).toThrow('naming rules');
        });

        it('should reject branch names ending with .lock', () => {
            expect(() => InputValidator.validateBranchName('feature.lock')).toThrow('naming rules');
        });

        it('should reject branch names with consecutive slashes', () => {
            expect(() => InputValidator.validateBranchName('feature//test')).toThrow(
                'naming rules'
            );
        });

        it('should reject empty or invalid branch names', () => {
            expect(() => InputValidator.validateBranchName('')).toThrow('non-empty string');
            expect(() => InputValidator.validateBranchName(null as any)).toThrow(
                'non-empty string'
            );
        });
    });

    describe('sanitizeCommitMessage', () => {
        it('should return clean messages unchanged', () => {
            expect(InputValidator.sanitizeCommitMessage('Fix bug')).toBe('Fix bug');
            expect(InputValidator.sanitizeCommitMessage('Add feature: new UI')).toBe(
                'Add feature: new UI'
            );
        });

        it('should escape backticks', () => {
            const result = InputValidator.sanitizeCommitMessage('Fix `bug`');
            expect(result).toBe('Fix \\`bug\\`');
        });

        it('should escape dollar signs', () => {
            const result = InputValidator.sanitizeCommitMessage('Cost: $100');
            expect(result).toBe('Cost: \\$100');
        });

        it('should escape backslashes', () => {
            const result = InputValidator.sanitizeCommitMessage('Path: C:\\Users');
            expect(result).toBe('Path: C:\\\\Users');
        });

        it('should remove null bytes', () => {
            const result = InputValidator.sanitizeCommitMessage('Test\0message');
            expect(result).toBe('Testmessage');
        });

        it('should handle command injection attempts', () => {
            const malicious = 'Test`rm -rf /`';
            const result = InputValidator.sanitizeCommitMessage(malicious);
            expect(result).toBe('Test\\`rm -rf /\\`');
        });

        it('should reject empty or invalid messages', () => {
            expect(() => InputValidator.sanitizeCommitMessage('')).toThrow('non-empty string');
            expect(() => InputValidator.sanitizeCommitMessage(null as any)).toThrow(
                'non-empty string'
            );
        });
    });

    describe('validateCommitRef', () => {
        it('should accept valid commit refs', () => {
            expect(() => InputValidator.validateCommitRef('main')).not.toThrow();
            expect(() => InputValidator.validateCommitRef('feature/branch')).not.toThrow();
            expect(() => InputValidator.validateCommitRef('abc1234')).not.toThrow();
            expect(() => InputValidator.validateCommitRef('v1.0.0')).not.toThrow();
            expect(() => InputValidator.validateCommitRef('HEAD')).not.toThrow();
            expect(() => InputValidator.validateCommitRef('HEAD~1')).not.toThrow();
        });

        it('should reject refs with null bytes', () => {
            expect(() => InputValidator.validateCommitRef('main\0')).toThrow('invalid characters');
        });

        it('should reject refs with double dots', () => {
            expect(() => InputValidator.validateCommitRef('main..feature')).toThrow(
                'invalid characters'
            );
        });

        it('should reject empty or invalid refs', () => {
            expect(() => InputValidator.validateCommitRef('')).toThrow('non-empty string');
            expect(() => InputValidator.validateCommitRef(null as any)).toThrow('non-empty string');
        });
    });

    describe('validateCommitRefs', () => {
        it('should accept valid commit refs array', () => {
            expect(() =>
                InputValidator.validateCommitRefs(['main', 'abc1234', 'HEAD'])
            ).not.toThrow();
        });

        it('should reject invalid arrays', () => {
            expect(() => InputValidator.validateCommitRefs(null as any)).toThrow(
                'must be an array'
            );
        });

        it('should reject arrays with invalid refs', () => {
            expect(() => InputValidator.validateCommitRefs(['main', 'test\0'])).toThrow();
        });
    });

    describe('validateCommitHash', () => {
        it('should accept valid commit hashes', () => {
            expect(() => InputValidator.validateCommitHash('abc1234')).not.toThrow();
            expect(() => InputValidator.validateCommitHash('1234567890abcdef')).not.toThrow();
            expect(() => InputValidator.validateCommitHash('a'.repeat(40))).not.toThrow();
        });

        it('should reject invalid commit hashes', () => {
            expect(() => InputValidator.validateCommitHash('abc')).toThrow('not a valid Git hash');
            expect(() => InputValidator.validateCommitHash('xyz1234')).toThrow(
                'not a valid Git hash'
            );
            expect(() => InputValidator.validateCommitHash('12345g7')).toThrow(
                'not a valid Git hash'
            );
            expect(() => InputValidator.validateCommitHash('a'.repeat(41))).toThrow(
                'not a valid Git hash'
            );
        });

        it('should reject empty or invalid hashes', () => {
            expect(() => InputValidator.validateCommitHash('')).toThrow('non-empty string');
            expect(() => InputValidator.validateCommitHash(null as any)).toThrow(
                'non-empty string'
            );
        });
    });

    describe('validateCommitHashes', () => {
        it('should accept valid commit hashes array', () => {
            expect(() => InputValidator.validateCommitHashes(['abc1234', 'def5678'])).not.toThrow();
        });

        it('should reject invalid arrays', () => {
            expect(() => InputValidator.validateCommitHashes(null as any)).toThrow(
                'must be an array'
            );
        });

        it('should reject arrays with invalid hashes', () => {
            expect(() => InputValidator.validateCommitHashes(['abc1234', 'invalid'])).toThrow();
        });
    });

    describe('validateRemoteName', () => {
        it('should accept valid remote names', () => {
            expect(() => InputValidator.validateRemoteName('origin')).not.toThrow();
            expect(() => InputValidator.validateRemoteName('upstream')).not.toThrow();
            expect(() => InputValidator.validateRemoteName('my-remote')).not.toThrow();
            expect(() => InputValidator.validateRemoteName('remote_1')).not.toThrow();
        });

        it('should reject invalid remote names', () => {
            expect(() => InputValidator.validateRemoteName('remote/name')).toThrow(
                'invalid characters'
            );
            expect(() => InputValidator.validateRemoteName('remote.name')).toThrow(
                'invalid characters'
            );
            expect(() => InputValidator.validateRemoteName('remote name')).toThrow(
                'invalid characters'
            );
        });

        it('should reject empty or invalid remote names', () => {
            expect(() => InputValidator.validateRemoteName('')).toThrow('non-empty string');
            expect(() => InputValidator.validateRemoteName(null as any)).toThrow(
                'non-empty string'
            );
        });
    });

    describe('validateStashIndex', () => {
        it('should accept valid stash indices', () => {
            expect(() => InputValidator.validateStashIndex(0)).not.toThrow();
            expect(() => InputValidator.validateStashIndex(5)).not.toThrow();
            expect(() => InputValidator.validateStashIndex(100)).not.toThrow();
        });

        it('should reject negative indices', () => {
            expect(() => InputValidator.validateStashIndex(-1)).toThrow('non-negative integer');
        });

        it('should reject non-integers', () => {
            expect(() => InputValidator.validateStashIndex(1.5)).toThrow('non-negative integer');
            expect(() => InputValidator.validateStashIndex(NaN)).toThrow('non-negative integer');
        });

        it('should reject non-numbers', () => {
            expect(() => InputValidator.validateStashIndex('0' as any)).toThrow(
                'non-negative integer'
            );
            expect(() => InputValidator.validateStashIndex(null as any)).toThrow(
                'non-negative integer'
            );
        });
    });
});
