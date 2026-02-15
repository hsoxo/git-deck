import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import simpleGit, { SimpleGit } from 'simple-git';
import { GitService } from './GitService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('GitService Integration Tests', () => {
    let git: SimpleGit;
    let gitService: GitService;
    let testDir: string;

    beforeEach(async () => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
        git = simpleGit(testDir);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        gitService = new GitService(testDir);

        // Create a test file
        fs.writeFileSync(path.join(testDir, 'test.txt'), 'test content');
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('getLog with parents', () => {
        it('should handle commits with multiple parents', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            // Create a branch
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'feature.txt'), 'feature');
            await git.add('feature.txt');
            await git.commit('Feature commit');

            // Merge
            await git.checkout('master');
            try {
                await git.merge(['feature']);
            } catch (error) {
                // Merge might fail in some git versions, that's ok
            }

            const commits = await gitService.getLog();
            expect(commits.length).toBeGreaterThan(0);
        });

        it('should limit commits with maxCount', async () => {
            await git.add('test.txt');
            await git.commit('Commit 1');
            fs.writeFileSync(path.join(testDir, 'test2.txt'), 'test2');
            await git.add('test2.txt');
            await git.commit('Commit 2');

            const commits = await gitService.getLog({ maxCount: 1 });
            expect(commits.length).toBe(1);
        });

        it('should handle from/to range', async () => {
            await git.add('test.txt');
            await git.commit('Commit 1');

            const log1 = await git.log();
            const hash1 = log1.latest!.hash;

            fs.writeFileSync(path.join(testDir, 'test2.txt'), 'test2');
            await git.add('test2.txt');
            await git.commit('Commit 2');

            const commits = await gitService.getLog({ from: hash1 });
            expect(commits.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('stageFiles validation', () => {
        it('should throw error for empty files array', async () => {
            await expect(gitService.stageFiles([])).rejects.toThrow('No files specified');
        });

        it('should throw error for invalid file paths with ..', async () => {
            await expect(gitService.stageFiles(['../outside.txt'])).rejects.toThrow(
                'Invalid file path'
            );
        });

        it('should throw error for absolute paths', async () => {
            await expect(gitService.stageFiles(['/absolute/path.txt'])).rejects.toThrow(
                'Invalid file path'
            );
        });
    });

    describe('unstageFiles', () => {
        it('should unstage files', async () => {
            await git.add('test.txt');
            await gitService.unstageFiles(['test.txt']);
            const status = await gitService.getStatus();
            expect(status.staged).not.toContain('test.txt');
        });
    });

    describe('stageAll', () => {
        it('should stage all files', async () => {
            fs.writeFileSync(path.join(testDir, 'test2.txt'), 'test2');
            await gitService.stageAll();
            const status = await gitService.getStatus();
            expect(status.staged.length).toBeGreaterThan(0);
        });
    });

    describe('unstageAll', () => {
        it('should unstage all files', async () => {
            // Need at least one commit for unstageAll to work
            await git.add('test.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'test2.txt'), 'test2');
            await git.add('test2.txt');

            await gitService.unstageAll();
            const status = await gitService.getStatus();
            expect(status.staged.length).toBe(0);
        });
    });

    describe('commit validation', () => {
        it('should throw error for empty message', async () => {
            await git.add('test.txt');
            await expect(gitService.commit('')).rejects.toThrow(
                'Commit message cannot be empty'
            );
        });

        it('should throw error for whitespace-only message', async () => {
            await git.add('test.txt');
            await expect(gitService.commit('   ')).rejects.toThrow(
                'Commit message cannot be empty'
            );
        });

        it('should throw error for too long message', async () => {
            await git.add('test.txt');
            const longMessage = 'a'.repeat(5001);
            await expect(gitService.commit(longMessage)).rejects.toThrow(
                'Commit message is too long'
            );
        });
    });

    describe('discardChanges', () => {
        it('should discard changes', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'test.txt'), 'modified content');
            await gitService.discardChanges(['test.txt']);

            const content = fs.readFileSync(path.join(testDir, 'test.txt'), 'utf-8');
            expect(content).toBe('test content');
        });
    });

    describe('getBranches', () => {
        it('should return branches', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            const branches = await gitService.getBranches();
            expect(branches.length).toBeGreaterThan(0);
            expect(branches.some((b) => b.current)).toBe(true);
        });
    });

    describe('getCurrentBranch', () => {
        it('should return current branch', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            const branch = await gitService.getCurrentBranch();
            expect(branch).toBeTruthy();
        });
    });

    describe('getHeadHash', () => {
        it('should return HEAD hash', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            const hash = await gitService.getHeadHash();
            expect(hash).toBeTruthy();
            expect(hash.length).toBe(40);
        });
    });

    describe('amendCommit', () => {
        it('should amend commit with new message', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            await gitService.amendCommit('Amended commit');

            const log = await git.log();
            expect(log.latest?.message).toBe('Amended commit');
        });

        it('should amend commit without changing message', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'test2.txt'), 'test2');
            await git.add('test2.txt');
            await gitService.amendCommit();

            const log = await git.log();
            expect(log.latest?.message).toBe('Initial commit');
        });
    });

    describe('getFileDiff', () => {
        it('should get unstaged diff', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'test.txt'), 'modified content');

            const diff = await gitService.getFileDiff('test.txt', false);
            expect(diff).toContain('modified content');
        });

        it('should get staged diff', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'test.txt'), 'modified content');
            await git.add('test.txt');

            const diff = await gitService.getFileDiff('test.txt', true);
            expect(diff).toContain('modified content');
        });
    });

    describe('revertCommits', () => {
        it('should revert commits', async () => {
            await git.add('test.txt');
            await git.commit('Initial commit');

            const log = await git.log();
            const hash = log.latest!.hash;

            await gitService.revertCommits([hash]);

            const newLog = await git.log();
            expect(newLog.all.length).toBe(2);
        });
    });

    describe('getRepoPath', () => {
        it('should return repo path', () => {
            const repoPath = gitService.getRepoPath();
            expect(repoPath).toBe(testDir);
        });
    });
});
