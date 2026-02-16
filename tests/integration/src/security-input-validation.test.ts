import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputValidator } from '../../../packages/extension/src/utils/InputValidator';
import { GitService } from '../../../packages/extension/src/git/GitService';
import { StageOperations } from '../../../packages/extension/src/git/operations/StageOperations';
import { BranchOperations } from '../../../packages/extension/src/git/operations/BranchOperations';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit from 'simple-git';

describe('Security: Input Validation Tests', () => {
    let testRepoPath: string;
    let gitService: GitService;
    let stageOps: StageOperations;
    let branchOps: BranchOperations;

    beforeEach(async () => {
        testRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-security-test-'));
        const git = simpleGit(testRepoPath);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        gitService = new GitService(testRepoPath);
        stageOps = new StageOperations(gitService);
        branchOps = new BranchOperations(gitService);

        // Create initial commit
        fs.writeFileSync(path.join(testRepoPath, 'test.txt'), 'initial');
        await git.add('test.txt');
        await git.commit('Initial commit');
    });

    afterEach(() => {
        if (fs.existsSync(testRepoPath)) {
            fs.rmSync(testRepoPath, { recursive: true, force: true });
        }
    });

    describe('Path Traversal Protection', () => {
        it('should reject relative path traversal (../)', () => {
            expect(() => {
                InputValidator.validateFilePath('../../../etc/passwd');
            }).toThrow('path traversal not allowed');
        });

        it('should reject absolute paths', () => {
            expect(() => {
                InputValidator.validateFilePath('/etc/passwd');
            }).toThrow('path traversal not allowed');
        });

        it('should reject paths with null bytes', () => {
            expect(() => {
                InputValidator.validateFilePath('file\0.txt');
            }).toThrow('null bytes not allowed');
        });

        it('should accept valid relative paths', () => {
            expect(() => {
                InputValidator.validateFilePath('src/file.txt');
            }).not.toThrow();
        });

        it('should accept paths with dots in filename', () => {
            expect(() => {
                InputValidator.validateFilePath('file.test.txt');
            }).not.toThrow();
        });
    });

    describe('Branch Name Validation', () => {
        it('should reject branch names with spaces', () => {
            expect(() => {
                InputValidator.validateBranchName('feature branch');
            }).toThrow('Invalid branch name');
        });

        it('should reject branch names starting with dash', () => {
            expect(() => {
                InputValidator.validateBranchName('-feature');
            }).toThrow('Invalid branch name');
        });

        it('should reject branch names with double dots', () => {
            expect(() => {
                InputValidator.validateBranchName('feature..test');
            }).toThrow('Invalid branch name');
        });

        it('should reject branch names with tilde', () => {
            expect(() => {
                InputValidator.validateBranchName('feature~1');
            }).toThrow('Invalid branch name');
        });

        it('should accept valid branch names', () => {
            expect(() => {
                InputValidator.validateBranchName('feature/test-123');
            }).not.toThrow();
        });
    });

    describe('Commit Message Sanitization', () => {
        it('should escape backticks', () => {
            const malicious = 'test`rm -rf /`';
            const sanitized = InputValidator.sanitizeCommitMessage(malicious);
            expect(sanitized).toBe('test\\`rm -rf /\\`');
        });

        it('should escape dollar signs', () => {
            const malicious = 'test$(whoami)';
            const sanitized = InputValidator.sanitizeCommitMessage(malicious);
            expect(sanitized).toBe('test\\$(whoami)');
        });

        it('should escape backslashes', () => {
            const malicious = 'test\\ninjection';
            const sanitized = InputValidator.sanitizeCommitMessage(malicious);
            expect(sanitized).toContain('\\\\');
        });

        it('should preserve normal text', () => {
            const normal = 'feat: add new feature';
            const sanitized = InputValidator.sanitizeCommitMessage(normal);
            expect(sanitized).toBe(normal);
        });
    });

    describe('Commit Hash Validation', () => {
        it('should reject invalid commit hashes', () => {
            expect(() => {
                InputValidator.validateCommitHash('not-a-hash');
            }).toThrow('not a valid Git hash');
        });

        it('should reject commit hashes with special chars', () => {
            expect(() => {
                InputValidator.validateCommitHash('abc123; rm -rf /');
            }).toThrow('not a valid Git hash');
        });

        it('should accept valid short hashes', () => {
            expect(() => {
                InputValidator.validateCommitHash('abc123f');
            }).not.toThrow();
        });

        it('should accept valid full hashes', () => {
            expect(() => {
                InputValidator.validateCommitHash('abc123f456789012345678901234567890abcdef');
            }).not.toThrow();
        });

        it('should accept HEAD reference using validateCommitRef', () => {
            expect(() => {
                InputValidator.validateCommitRef('HEAD');
            }).not.toThrow();
        });
    });

    describe('Remote Name Validation', () => {
        it('should reject remote names with slashes', () => {
            expect(() => {
                InputValidator.validateRemoteName('origin/master');
            }).toThrow('Invalid remote name');
        });

        it('should reject remote names with spaces', () => {
            expect(() => {
                InputValidator.validateRemoteName('my origin');
            }).toThrow('Invalid remote name');
        });

        it('should accept valid remote names', () => {
            expect(() => {
                InputValidator.validateRemoteName('origin');
            }).not.toThrow();
        });
    });

    describe('Stash Index Validation', () => {
        it('should reject negative indices', () => {
            expect(() => {
                InputValidator.validateStashIndex(-1);
            }).toThrow('Invalid stash index');
        });

        it('should reject non-integer values', () => {
            expect(() => {
                InputValidator.validateStashIndex(1.5);
            }).toThrow('Invalid stash index');
        });

        it('should accept valid indices', () => {
            expect(() => {
                InputValidator.validateStashIndex(0);
            }).not.toThrow();
        });
    });

    describe('Integration: Stage Operations with Validation', () => {
        it('should prevent staging files with path traversal', async () => {
            await expect(async () => {
                await stageOps.stage(['../../../etc/passwd']);
            }).rejects.toThrow();
        });

        it('should allow staging valid files', async () => {
            fs.writeFileSync(path.join(testRepoPath, 'valid.txt'), 'content');
            const git = simpleGit(testRepoPath);
            await git.add('valid.txt');
            const status = await git.status();
            expect(status.staged).toContain('valid.txt');
        });
    });

    describe('Integration: Branch Operations with Validation', () => {
        it('should prevent creating branches with invalid names', async () => {
            await expect(async () => {
                await branchOps.createBranch('feature..test');
            }).rejects.toThrow();
        });

        it('should allow creating branches with valid names', async () => {
            const git = simpleGit(testRepoPath);
            await git.checkoutLocalBranch('feature/test');
            const branches = await git.branch();
            expect(branches.all).toContain('feature/test');
        });
    });
});
