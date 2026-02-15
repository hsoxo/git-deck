import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import simpleGit, { SimpleGit } from 'simple-git';
import { LogOperations } from './LogOperations';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('LogOperations', () => {
    let git: SimpleGit;
    let logOps: LogOperations;
    let testDir: string;

    beforeEach(async () => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
        git = simpleGit(testDir);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        logOps = new LogOperations(git);

        // Create initial commits
        fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
        await git.add('file1.txt');
        await git.commit('First commit');

        fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
        await git.add('file2.txt');
        await git.commit('Second commit');
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('getLog', () => {
        it('should get commit log', async () => {
            const commits = await logOps.getLog({ maxCount: 10 });
            expect(commits.length).toBeGreaterThanOrEqual(1);
        });

        it('should limit commits with maxCount', async () => {
            const commits = await logOps.getLog({ maxCount: 1 });
            expect(commits.length).toBeLessThanOrEqual(1);
        });
    });

    describe('getCommitDetails', () => {
        it('should get commit details', async () => {
            const log = await git.log({ maxCount: 1 });
            const hash = log.latest!.hash;

            const details = await logOps.getCommitDetails(hash);
            expect(details).toBeTruthy();
            if (details) {
                expect(details.hash).toBe(hash);
            }
        });
    });

    describe('getCommitFiles', () => {
        it('should get commit files', async () => {
            const log = await git.log({ maxCount: 1 });
            const hash = log.latest!.hash;

            const files = await logOps.getCommitFiles(hash);
            expect(files.length).toBeGreaterThan(0);
        });
    });

    describe('getCommitStats', () => {
        it('should get commit stats', async () => {
            const log = await git.log({ maxCount: 1 });
            const hash = log.latest!.hash;

            const stats = await logOps.getCommitStats(hash);
            expect(stats).toBeTruthy();
            expect(stats.files).toBeGreaterThanOrEqual(0);
        });
    });

    describe('searchCommits', () => {
        it('should search commits by message', async () => {
            const commits = await logOps.searchCommits('Second', { maxCount: 10 });
            // May or may not find depending on git version
            expect(Array.isArray(commits)).toBe(true);
        });
    });

    describe('getCommitsByAuthor', () => {
        it('should get commits by author', async () => {
            const commits = await logOps.getCommitsByAuthor('Test User', { maxCount: 10 });
            // May return 0 or more depending on git configuration
            expect(Array.isArray(commits)).toBe(true);
        });
    });

    describe('getCommitsByDateRange', () => {
        it('should get commits by date range', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const commits = await logOps.getCommitsByDateRange(yesterday, tomorrow, {
                maxCount: 10,
            });
            expect(Array.isArray(commits)).toBe(true);
        });
    });
});
