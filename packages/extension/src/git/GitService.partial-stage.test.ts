import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitService } from './GitService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('GitService - Partial Staging', () => {
    let testRepoPath: string;
    let gitService: GitService;

    beforeEach(() => {
        // Create a temporary directory for the test repository
        testRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-gui-test-'));

        // Initialize a git repository
        execSync('git init', { cwd: testRepoPath });
        execSync('git config user.email "test@example.com"', { cwd: testRepoPath });
        execSync('git config user.name "Test User"', { cwd: testRepoPath });

        // Create initial commit
        const testFile = path.join(testRepoPath, 'test.txt');
        fs.writeFileSync(testFile, 'line 1\nline 2\nline 3\nline 4\nline 5\n');
        execSync('git add test.txt', { cwd: testRepoPath });
        execSync('git commit -m "Initial commit"', { cwd: testRepoPath });

        gitService = new GitService(testRepoPath);
    });

    afterEach(() => {
        // Clean up the test repository
        if (fs.existsSync(testRepoPath)) {
            fs.rmSync(testRepoPath, { recursive: true, force: true });
        }
    });

    it('should show file in unstaged when modified but not staged', async () => {
        // Modify the file
        const testFile = path.join(testRepoPath, 'test.txt');
        fs.writeFileSync(testFile, 'line 1 modified\nline 2\nline 3\nline 4\nline 5\n');

        const status = await gitService.getStatus();

        expect(status.unstaged).toContain('test.txt');
        expect(status.staged).not.toContain('test.txt');
    });

    it('should show file in staged when fully staged', async () => {
        // Modify and stage the file
        const testFile = path.join(testRepoPath, 'test.txt');
        fs.writeFileSync(testFile, 'line 1 modified\nline 2\nline 3\nline 4\nline 5\n');
        await gitService.stageFiles(['test.txt']);

        const status = await gitService.getStatus();

        expect(status.staged).toContain('test.txt');
        expect(status.unstaged).not.toContain('test.txt');
    });

    it('should show file in BOTH staged and unstaged when partially staged', async () => {
        // Modify the file
        const testFile = path.join(testRepoPath, 'test.txt');
        fs.writeFileSync(testFile, 'line 1 modified\nline 2\nline 3\nline 4\nline 5\n');

        // Stage the file
        await gitService.stageFiles(['test.txt']);

        // Modify again (creating unstaged changes)
        fs.writeFileSync(testFile, 'line 1 modified\nline 2 modified again\nline 3\nline 4\nline 5\n');

        const status = await gitService.getStatus();

        // The file should appear in BOTH staged and unstaged
        expect(status.staged).toContain('test.txt');
        expect(status.unstaged).toContain('test.txt');
    });

    it('should handle multiple files with different staging states', async () => {
        // Create multiple files
        const file1 = path.join(testRepoPath, 'file1.txt');
        const file2 = path.join(testRepoPath, 'file2.txt');
        const file3 = path.join(testRepoPath, 'file3.txt');

        fs.writeFileSync(file1, 'content 1\n');
        fs.writeFileSync(file2, 'content 2\n');
        fs.writeFileSync(file3, 'content 3\n');

        execSync('git add .', { cwd: testRepoPath });
        execSync('git commit -m "Add files"', { cwd: testRepoPath });

        // file1: only unstaged changes
        fs.writeFileSync(file1, 'content 1 modified\n');

        // file2: fully staged changes
        fs.writeFileSync(file2, 'content 2 modified\n');
        await gitService.stageFiles(['file2.txt']);

        // file3: partially staged (staged + unstaged)
        fs.writeFileSync(file3, 'content 3 modified\n');
        await gitService.stageFiles(['file3.txt']);
        fs.writeFileSync(file3, 'content 3 modified again\n');

        const status = await gitService.getStatus();

        // file1: only in unstaged
        expect(status.unstaged).toContain('file1.txt');
        expect(status.staged).not.toContain('file1.txt');

        // file2: only in staged
        expect(status.staged).toContain('file2.txt');
        expect(status.unstaged).not.toContain('file2.txt');

        // file3: in BOTH staged and unstaged
        expect(status.staged).toContain('file3.txt');
        expect(status.unstaged).toContain('file3.txt');
    });

    it('should show correct diff for partially staged file', async () => {
        // Modify the file
        const testFile = path.join(testRepoPath, 'test.txt');
        const originalContent = 'line 1\nline 2\nline 3\nline 4\nline 5\n';
        const stagedContent = 'line 1 modified\nline 2\nline 3\nline 4\nline 5\n';
        const workingContent = 'line 1 modified\nline 2 modified again\nline 3\nline 4\nline 5\n';

        // First modification and stage
        fs.writeFileSync(testFile, stagedContent);
        await gitService.stageFiles(['test.txt']);

        // Second modification (not staged)
        fs.writeFileSync(testFile, workingContent);

        // Get diffs
        const stagedDiff = await gitService.getFileDiff('test.txt', true);
        const unstagedDiff = await gitService.getFileDiff('test.txt', false);

        // Staged diff should show the first modification
        expect(stagedDiff).toContain('line 1 modified');
        expect(stagedDiff).not.toContain('line 2 modified again');

        // Unstaged diff should show the second modification
        expect(unstagedDiff).toContain('line 2 modified again');
    });
});
