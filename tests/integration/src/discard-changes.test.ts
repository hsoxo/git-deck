import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';

describe('Discard Changes Integration Tests', () => {
    let testRepoPath: string;
    let git: SimpleGit;

    beforeEach(async () => {
        testRepoPath = path.join(os.tmpdir(), `git-gui-discard-test-${Date.now()}`);
        fs.mkdirSync(testRepoPath, { recursive: true });

        git = simpleGit(testRepoPath);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');
    });

    afterEach(() => {
        if (fs.existsSync(testRepoPath)) {
            fs.rmSync(testRepoPath, { recursive: true, force: true });
        }
    });

    describe('Discard Modified Files', () => {
        it('should discard changes in a modified file', async () => {
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Original content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(file1, 'Modified content');

            await git.checkout(['--', 'file1.txt']);

            const content = fs.readFileSync(file1, 'utf-8');
            expect(content).toBe('Original content');
        });

        it('should discard changes in multiple files', async () => {
            const file1 = path.join(testRepoPath, 'file1.txt');
            const file2 = path.join(testRepoPath, 'file2.txt');
            fs.writeFileSync(file1, 'Content 1');
            fs.writeFileSync(file2, 'Content 2');
            await git.add(['file1.txt', 'file2.txt']);
            await git.commit('Initial commit');

            fs.writeFileSync(file1, 'Modified 1');
            fs.writeFileSync(file2, 'Modified 2');

            await git.checkout(['--', 'file1.txt', 'file2.txt']);

            expect(fs.readFileSync(file1, 'utf-8')).toBe('Content 1');
            expect(fs.readFileSync(file2, 'utf-8')).toBe('Content 2');
        });
    });

    describe('Discard Deleted Files', () => {
        it('should restore deleted file', async () => {
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            fs.unlinkSync(file1);

            await git.checkout(['--', 'file1.txt']);

            expect(fs.existsSync(file1)).toBe(true);
            expect(fs.readFileSync(file1, 'utf-8')).toBe('Content');
        });
    });
});
