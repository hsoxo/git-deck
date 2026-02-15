import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import simpleGit, { SimpleGit } from 'simple-git';
import { DiffOperations } from './DiffOperations';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('DiffOperations Integration Tests', () => {
    let git: SimpleGit;
    let diffOps: DiffOperations;
    let testDir: string;

    beforeEach(async () => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
        git = simpleGit(testDir);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        diffOps = new DiffOperations(git);

        // Create initial commit
        fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
        await git.add('file1.txt');
        await git.commit('Initial commit');
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('getDiffStats', () => {
        it('should return empty array when no changes', async () => {
            const stats = await diffOps.getDiffStats();
            expect(stats).toEqual([]);
        });
    });

    describe('getCommitChanges', () => {
        it('should get commit changes', async () => {
            const log = await git.log();
            const hash = log.latest!.hash;

            const changes = await diffOps.getCommitChanges(hash);
            expect(changes).toContain('file1.txt');
        });
    });

    describe('getCommitDiff', () => {
        it('should get diff between two commits', async () => {
            const log1 = await git.log();
            const hash1 = log1.latest!.hash;

            fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
            await git.add('file2.txt');
            await git.commit('Second commit');

            const log2 = await git.log();
            const hash2 = log2.latest!.hash;

            const diff = await diffOps.getCommitDiff(hash1, hash2);
            expect(diff).toContain('file2.txt');
        });
    });
});
