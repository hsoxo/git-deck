import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import simpleGit, { SimpleGit } from 'simple-git';
import { StageOperations } from './StageOperations';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('StageOperations Integration Tests', () => {
    let git: SimpleGit;
    let stageOps: StageOperations;
    let testDir: string;

    beforeEach(async () => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
        git = simpleGit(testDir);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        stageOps = new StageOperations(git);

        // Create test files
        fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
        fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('stage', () => {
        it('should stage single file', async () => {
            await stageOps.stage(['file1.txt']);
            const status = await git.status();
            expect(status.staged).toContain('file1.txt');
        });

        it('should stage multiple files', async () => {
            await stageOps.stage(['file1.txt', 'file2.txt']);
            const status = await git.status();
            expect(status.staged).toContain('file1.txt');
            expect(status.staged).toContain('file2.txt');
        });
    });

    describe('unstage', () => {
        it('should unstage single file', async () => {
            await git.add('file1.txt');
            await stageOps.unstage(['file1.txt']);
            const status = await git.status();
            expect(status.staged).not.toContain('file1.txt');
        });

        it('should unstage multiple files', async () => {
            await git.add(['file1.txt', 'file2.txt']);
            await stageOps.unstage(['file1.txt', 'file2.txt']);
            const status = await git.status();
            expect(status.staged.length).toBe(0);
        });
    });

    describe('stageAll', () => {
        it('should stage all files', async () => {
            await stageOps.stageAll();
            const status = await git.status();
            expect(status.staged.length).toBeGreaterThan(0);
        });
    });

    describe('unstageAll', () => {
        it('should unstage all files', async () => {
            // Need at least one commit for unstageAll to work
            await git.add(['file1.txt', 'file2.txt']);
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'file3.txt'), 'content3');
            await git.add('file3.txt');

            await stageOps.unstageAll();
            const status = await git.status();
            expect(status.staged.length).toBe(0);
        });
    });

    describe('discard', () => {
        it('should discard changes', async () => {
            await git.add('file1.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'modified');
            await stageOps.discard(['file1.txt']);

            const content = fs.readFileSync(path.join(testDir, 'file1.txt'), 'utf-8');
            expect(content).toBe('content1');
        });

        it('should discard multiple files', async () => {
            await git.add(['file1.txt', 'file2.txt']);
            await git.commit('Initial commit');

            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'modified1');
            fs.writeFileSync(path.join(testDir, 'file2.txt'), 'modified2');

            await stageOps.discard(['file1.txt', 'file2.txt']);

            const content1 = fs.readFileSync(path.join(testDir, 'file1.txt'), 'utf-8');
            const content2 = fs.readFileSync(path.join(testDir, 'file2.txt'), 'utf-8');
            expect(content1).toBe('content1');
            expect(content2).toBe('content2');
        });
    });
});
