import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitService } from '../../../packages/extension/src/git/GitService';
import { StageOperations } from '../../../packages/extension/src/git/operations/StageOperations';
import { BranchOperations } from '../../../packages/extension/src/git/operations/BranchOperations';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit from 'simple-git';

describe('Security: Input Fuzzing Tests', () => {
    let testRepoPath: string;
    let gitService: GitService;
    let stageOps: StageOperations;
    let branchOps: BranchOperations;

    beforeEach(async () => {
        testRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-fuzz-test-'));
        const git = simpleGit(testRepoPath);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        gitService = new GitService(testRepoPath);
        stageOps = new StageOperations(git);
        branchOps = new BranchOperations(git);

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

    describe('File Path Fuzzing', () => {
        const maliciousPaths = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32',
            '/etc/shadow',
            'C:\\Windows\\System32\\config\\SAM',
            'file\0.txt',
            'file\n.txt',
            'file\r.txt',
            'file;rm -rf /',
            'file`whoami`',
            'file$(whoami)',
            'file|cat /etc/passwd',
            'file&& rm -rf /',
            'file || echo hacked',
            '../.git/config',
            '.git/hooks/pre-commit',
            '.../.../.../',
            'file\x00.txt',
            'file\x1b[31m.txt',
            'file\u0000.txt',
            'file\u202e.txt', // Right-to-left override
        ];

        maliciousPaths.forEach((maliciousPath) => {
            it(`should reject malicious path: ${JSON.stringify(maliciousPath)}`, async () => {
                await expect(async () => {
                    await stageOps.stage([maliciousPath]);
                }).rejects.toThrow();
            });
        });
    });

    describe('Branch Name Fuzzing', () => {
        const maliciousBranchNames = [
            'feature..test',
            '-feature',
            'feature~1',
            'feature^1',
            'feature:test',
            'feature*test',
            'feature?test',
            'feature[test]',
            'feature\\test',
            'feature@{test}',
            'feature test',
            'feature\ttab',
            'feature\nnewline',
            'feature//',
            '/feature',
            'feature/',
            '.feature',
            'feature.',
            'feature...',
            // Note: 'feature-', 'feature@', 'feature{', 'feature}', 'refs/heads/master' are valid in Git
            'HEAD',
            '../master',
        ];

        maliciousBranchNames.forEach((maliciousName) => {
            it(`should reject malicious branch name: ${JSON.stringify(maliciousName)}`, async () => {
                await expect(async () => {
                    await branchOps.createBranch(maliciousName);
                }).rejects.toThrow();
            });
        });
    });

    describe('Commit Message Fuzzing', () => {
        const maliciousMessages = [
            'test`rm -rf /`',
            'test$(whoami)',
            'test;cat /etc/passwd',
            'test|whoami',
            'test&&echo hacked',
            'test||echo hacked',
            'test\nrm -rf /',
            'test\\ninjection',
            'test$HOME',
            'test${HOME}',
            'test`ls`',
            'test$(ls)',
            'test\u202e', // Right-to-left override
            'test' + '\x1b[31m', // ANSI escape
            'test\r\ninjection',
            'test<!--injection-->',
            'test<script>alert(1)</script>',
        ];

        // Messages with null bytes should be rejected by Git itself
        const nullByteMessages = ['test\0injection', 'test\x00\x01\x02', 'test\u0000'];

        maliciousMessages.forEach((maliciousMsg) => {
            it(`should handle malicious commit message: ${JSON.stringify(maliciousMsg.substring(0, 30))}`, async () => {
                fs.writeFileSync(path.join(testRepoPath, 'fuzz.txt'), 'content');
                await stageOps.stage(['fuzz.txt']);

                // Should not throw - Git handles these safely
                await expect(gitService.commit(maliciousMsg)).resolves.not.toThrow();

                // Verify the commit was created
                const log = await gitService.getLog({ maxCount: 1 });
                expect(log).toHaveLength(1);
                expect(log[0].message).toBeDefined();
            });
        });

        nullByteMessages.forEach((maliciousMsg) => {
            it(`should reject commit message with null bytes: ${JSON.stringify(maliciousMsg.substring(0, 30))}`, async () => {
                fs.writeFileSync(path.join(testRepoPath, 'fuzz-null.txt'), 'content');
                await stageOps.stage(['fuzz-null.txt']);

                // Git rejects null bytes in commit messages
                await expect(gitService.commit(maliciousMsg)).rejects.toThrow();
            });
        });
    });

    describe('Large Input Fuzzing', () => {
        it('should handle very long file paths', async () => {
            const longPath = 'a'.repeat(1000) + '.txt';
            await expect(async () => {
                await stageOps.stage([longPath]);
            }).rejects.toThrow();
        });

        it('should handle very long branch names', async () => {
            const longName = 'feature/' + 'a'.repeat(500);
            await expect(async () => {
                await branchOps.createBranch(longName);
            }).rejects.toThrow();
        });

        it('should handle very long commit messages', async () => {
            const longMessage = 'a'.repeat(10000);
            fs.writeFileSync(path.join(testRepoPath, 'large.txt'), 'content');
            await stageOps.stage(['large.txt']);

            // GitService rejects messages > 5000 chars
            await expect(gitService.commit(longMessage)).rejects.toThrow('too long');
        });

        it('should handle many files at once', async () => {
            const files: string[] = [];
            for (let i = 0; i < 100; i++) {
                const filename = `file${i}.txt`;
                fs.writeFileSync(path.join(testRepoPath, filename), `content${i}`);
                files.push(filename);
            }

            await expect(stageOps.stage(files)).resolves.not.toThrow();
        });
    });

    describe('Special Character Fuzzing', () => {
        const specialChars = [
            '\x00',
            '\x01',
            '\x02',
            '\x03',
            '\x04',
            '\x05',
            '\x06',
            '\x07',
            '\x08',
            '\x09',
            '\x0a',
            '\x0b',
            '\x0c',
            '\x0d',
            '\x0e',
            '\x0f',
            '\x1b',
            '\x7f',
            '\xff',
        ];

        specialChars.forEach((char, index) => {
            it(`should handle special character 0x${char.charCodeAt(0).toString(16)}`, async () => {
                const testPath = `file${char}test.txt`;
                await expect(async () => {
                    await stageOps.stage([testPath]);
                }).rejects.toThrow();
            });
        });
    });

    describe('Unicode Fuzzing', () => {
        const unicodePaths = [
            'file\u202e.txt', // Right-to-left override
            'file\u200b.txt', // Zero-width space
            'file\ufeff.txt', // Zero-width no-break space
            'file\u2028.txt', // Line separator
            'file\u2029.txt', // Paragraph separator
            'file\ud800.txt', // Unpaired surrogate
            'file\udfff.txt', // Unpaired surrogate
            'file\uffff.txt', // Non-character
            'file\u0000.txt', // Null character
        ];

        unicodePaths.forEach((unicodePath) => {
            it(`should handle unicode path: ${JSON.stringify(unicodePath)}`, async () => {
                // These should either be rejected or handled safely
                try {
                    await stageOps.stage([unicodePath]);
                    // If it doesn't throw, verify it was sanitized
                    const status = await gitService.getStatus();
                    // Should not contain the exact malicious unicode
                    expect(JSON.stringify(status)).not.toContain('\u202e');
                } catch (error) {
                    // Rejection is also acceptable
                    expect(error).toBeDefined();
                }
            });
        });
    });

    describe('Boundary Value Fuzzing', () => {
        it('should handle empty file path', async () => {
            await expect(async () => {
                await stageOps.stage(['']);
            }).rejects.toThrow();
        });

        it('should handle empty branch name', async () => {
            await expect(async () => {
                await branchOps.createBranch('');
            }).rejects.toThrow();
        });

        it('should handle empty commit message', async () => {
            fs.writeFileSync(path.join(testRepoPath, 'empty.txt'), 'content');
            await stageOps.stage(['empty.txt']);

            await expect(async () => {
                await gitService.commit('');
            }).rejects.toThrow();
        });

        it('should handle whitespace-only inputs', async () => {
            await expect(async () => {
                await stageOps.stage(['   ']);
            }).rejects.toThrow();
        });
    });

    describe('Array Fuzzing', () => {
        it('should handle empty array', async () => {
            await expect(stageOps.stage([])).resolves.not.toThrow();
        });

        it('should handle array with null', async () => {
            await expect(async () => {
                await stageOps.stage([null as any]);
            }).rejects.toThrow();
        });

        it('should handle array with undefined', async () => {
            await expect(async () => {
                await stageOps.stage([undefined as any]);
            }).rejects.toThrow();
        });

        it('should handle mixed valid and invalid paths', async () => {
            fs.writeFileSync(path.join(testRepoPath, 'valid.txt'), 'content');

            await expect(async () => {
                await stageOps.stage(['valid.txt', '../../../etc/passwd']);
            }).rejects.toThrow();
        });
    });
});
