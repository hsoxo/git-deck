import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';

describe('Diff Operations Integration Tests', () => {
    let testRepoPath: string;
    let git: SimpleGit;

    beforeEach(async () => {
        // 创建临时测试仓库
        testRepoPath = path.join(os.tmpdir(), `git-gui-diff-test-${Date.now()}`);
        fs.mkdirSync(testRepoPath, { recursive: true });

        git = simpleGit(testRepoPath);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');
    });

    afterEach(() => {
        // 清理测试仓库
        if (fs.existsSync(testRepoPath)) {
            fs.rmSync(testRepoPath, { recursive: true, force: true });
        }
    });

    describe('File Diff', () => {
        it('should get unstaged file diff', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Line 1\nLine 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改文件但不 stage
            fs.writeFileSync(file1, 'Line 1\nModified Line 2\nLine 3');

            // 获取 diff
            const diff = await git.diff(['file1.txt']);

            // 验证 diff 内容
            expect(diff).toContain('-Line 2');
            expect(diff).toContain('+Modified Line 2');
            expect(diff).toContain('file1.txt');
        });

        it('should get staged file diff', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Line 1\nLine 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改文件并 stage
            fs.writeFileSync(file1, 'Line 1\nModified Line 2\nLine 3');
            await git.add('file1.txt');

            // 获取 staged diff
            const diff = await git.diff(['--cached', 'file1.txt']);

            // 验证 diff 内容
            expect(diff).toContain('-Line 2');
            expect(diff).toContain('+Modified Line 2');
        });

        it('should get diff for new file', async () => {
            // 创建新文件
            const file1 = path.join(testRepoPath, 'newfile.txt');
            fs.writeFileSync(file1, 'New content');
            await git.add('newfile.txt');

            // 获取 staged diff
            const diff = await git.diff(['--cached', 'newfile.txt']);

            // 验证 diff 显示新文件
            expect(diff).toContain('+New content');
            expect(diff).toContain('newfile.txt');
        });

        it('should get diff for deleted file', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Content to delete');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 删除文件
            fs.unlinkSync(file1);
            await git.rm('file1.txt');

            // 获取 staged diff
            const diff = await git.diff(['--cached']);

            // 验证 diff 显示删除
            expect(diff).toContain('-Content to delete');
        });
    });

    describe('Diff Statistics', () => {
        it('should get diff statistics', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Line 1\nLine 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改文件
            fs.writeFileSync(file1, 'Line 1\nModified Line 2\nLine 3\nLine 4');

            // 获取 diff 统计
            const stats = await git.diff(['--numstat', 'file1.txt']);

            // 验证统计信息
            expect(stats).toContain('file1.txt');
            // 格式: additions\tdeletions\tfilename
            const lines = stats.split('\n').filter(Boolean);
            expect(lines.length).toBeGreaterThan(0);

            const [additions, deletions, filename] = lines[0].split('\t');
            expect(filename).toBe('file1.txt');
            expect(parseInt(additions)).toBeGreaterThan(0);
        });

        it('should get staged diff statistics', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            const file2 = path.join(testRepoPath, 'file2.txt');
            fs.writeFileSync(file1, 'Content 1');
            fs.writeFileSync(file2, 'Content 2');
            await git.add(['file1.txt', 'file2.txt']);
            await git.commit('Initial commit');

            // 修改两个文件
            fs.writeFileSync(file1, 'Modified Content 1');
            fs.writeFileSync(file2, 'Modified Content 2');
            await git.add(['file1.txt', 'file2.txt']);

            // 获取 staged diff 统计
            const stats = await git.diff(['--cached', '--numstat']);

            // 验证统计信息包含两个文件
            expect(stats).toContain('file1.txt');
            expect(stats).toContain('file2.txt');

            const lines = stats.split('\n').filter(Boolean);
            expect(lines.length).toBe(2);
        });
    });

    describe('Commit Diff', () => {
        it('should get commit changes', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Initial content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改并提交
            fs.writeFileSync(file1, 'Modified content');
            await git.add('file1.txt');
            await git.commit('Modify file');

            // 获取最后一个 commit
            const log = await git.log({ maxCount: 1 });
            const commitHash = log.latest!.hash;

            // 获取 commit 的变更
            const changes = await git.show([commitHash]);

            // 验证变更内容
            expect(changes).toContain('-Initial content');
            expect(changes).toContain('+Modified content');
            expect(changes).toContain('Modify file');
        });

        it('should get diff between two commits', async () => {
            // 创建第一个 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Version 1');
            await git.add('file1.txt');
            await git.commit('Commit 1');
            const log1 = await git.log({ maxCount: 1 });
            const commit1 = log1.latest!.hash;

            // 创建第二个 commit
            fs.writeFileSync(file1, 'Version 2');
            await git.add('file1.txt');
            await git.commit('Commit 2');

            // 创建第三个 commit
            fs.writeFileSync(file1, 'Version 3');
            await git.add('file1.txt');
            await git.commit('Commit 3');
            const log3 = await git.log({ maxCount: 1 });
            const commit3 = log3.latest!.hash;

            // 获取两个 commits 之间的 diff
            const diff = await git.diff([commit1, commit3]);

            // 验证 diff 内容
            expect(diff).toContain('-Version 1');
            expect(diff).toContain('+Version 3');
        });
    });

    describe('Multiple Files Diff', () => {
        it('should get diff for multiple files', async () => {
            // 创建初始 commits
            const file1 = path.join(testRepoPath, 'file1.txt');
            const file2 = path.join(testRepoPath, 'file2.txt');
            fs.writeFileSync(file1, 'Content 1');
            fs.writeFileSync(file2, 'Content 2');
            await git.add(['file1.txt', 'file2.txt']);
            await git.commit('Initial commit');

            // 修改两个文件
            fs.writeFileSync(file1, 'Modified Content 1');
            fs.writeFileSync(file2, 'Modified Content 2');

            // 获取所有 diff
            const diff = await git.diff();

            // 验证包含两个文件的变更
            expect(diff).toContain('file1.txt');
            expect(diff).toContain('file2.txt');
            expect(diff).toContain('-Content 1');
            expect(diff).toContain('+Modified Content 1');
            expect(diff).toContain('-Content 2');
            expect(diff).toContain('+Modified Content 2');
        });
    });
});
