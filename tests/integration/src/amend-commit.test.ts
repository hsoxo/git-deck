import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';

describe('Amend Commit Integration Tests', () => {
    let testRepoPath: string;
    let git: SimpleGit;

    beforeEach(async () => {
        // 创建临时测试仓库
        testRepoPath = path.join(os.tmpdir(), `git-gui-amend-test-${Date.now()}`);
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

    describe('Amend Commit Message', () => {
        it('should amend commit message', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Initial content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 获取 commit hash
            const log1 = await git.log({ maxCount: 1 });
            const originalHash = log1.latest!.hash;
            const originalMessage = log1.latest!.message;

            // Amend commit message
            await git.commit('Amended commit message', undefined, ['--amend']);

            // 验证 commit message 已更改
            const log2 = await git.log({ maxCount: 1 });
            expect(log2.latest!.message).toBe('Amended commit message');
            expect(log2.latest!.message).not.toBe(originalMessage);

            // 验证 commit hash 已更改（amend 会创建新 commit）
            expect(log2.latest!.hash).not.toBe(originalHash);

            // 验证只有一个 commit
            expect(log2.total).toBe(1);
        });

        it('should amend without changing message', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Initial content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            const log1 = await git.log({ maxCount: 1 });
            const originalMessage = log1.latest!.message;

            // Amend without changing message
            await git.raw(['commit', '--amend', '--no-edit']);

            // 验证 commit message 未更改
            const log2 = await git.log({ maxCount: 1 });
            expect(log2.latest!.message).toBe(originalMessage);
        });
    });

    describe('Amend Commit Content', () => {
        it('should amend commit with new files', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Content 1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 添加新文件并 amend
            const file2 = path.join(testRepoPath, 'file2.txt');
            fs.writeFileSync(file2, 'Content 2');
            await git.add('file2.txt');
            await git.raw(['commit', '--amend', '--no-edit']);

            // 验证最后一个 commit 包含两个文件
            const log = await git.log({ maxCount: 1 });
            const commitHash = log.latest!.hash;
            const changes = await git.show([commitHash]);

            expect(changes).toContain('file1.txt');
            expect(changes).toContain('file2.txt');

            // 验证只有一个 commit
            expect(log.total).toBe(1);
        });

        it('should amend commit with modified files', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Original content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改文件并 amend
            fs.writeFileSync(file1, 'Modified content');
            await git.add('file1.txt');
            await git.raw(['commit', '--amend', '--no-edit']);

            // 验证文件内容已更新
            const log = await git.log({ maxCount: 1 });
            const commitHash = log.latest!.hash;
            const changes = await git.show([commitHash]);

            expect(changes).toContain('+Modified content');
            expect(changes).not.toContain('+Original content');
        });

        it('should amend commit by removing files', async () => {
            // 创建包含两个文件的 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            const file2 = path.join(testRepoPath, 'file2.txt');
            fs.writeFileSync(file1, 'Content 1');
            fs.writeFileSync(file2, 'Content 2');
            await git.add(['file1.txt', 'file2.txt']);
            await git.commit('Initial commit with two files');

            // 验证 commit 包含两个文件
            const log1 = await git.log({ maxCount: 1 });
            const changes1 = await git.show([log1.latest!.hash]);
            expect(changes1).toContain('file1.txt');
            expect(changes1).toContain('file2.txt');

            // 从 index 移除 file2 并 amend
            await git.rm(['--cached', 'file2.txt']);
            await git.raw(['commit', '--amend', '-m', 'Amended commit with one file']);

            // 验证最后一个 commit 只包含一个文件
            const log = await git.log({ maxCount: 1 });
            const commitHash = log.latest!.hash;
            const changes = await git.show([commitHash]);

            expect(changes).toContain('file1.txt');
            expect(changes).not.toContain('file2.txt');
            expect(log.total).toBe(1); // Only 1 commit
        });
    });

    describe('Amend with Message and Content', () => {
        it('should amend both message and content', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Original content');
            await git.add('file1.txt');
            await git.commit('Original message');

            // 修改文件和 message
            fs.writeFileSync(file1, 'Modified content');
            await git.add('file1.txt');
            await git.commit('Amended message', ['--amend']);

            // 验证 message 和内容都已更改
            const log = await git.log({ maxCount: 1 });
            expect(log.latest!.message).toBe('Amended message');

            const commitHash = log.latest!.hash;
            const changes = await git.show([commitHash]);
            expect(changes).toContain('+Modified content');
        });
    });

    describe('Amend Edge Cases', () => {
        it('should not amend if no commits exist', async () => {
            // 尝试在没有 commits 的情况下 amend
            try {
                await git.raw(['commit', '--amend', '--no-edit']);
                expect.fail('Should throw error when no commits exist');
            } catch (error) {
                // 预期会失败
                expect(error).toBeDefined();
            }
        });

        it('should preserve commit author when amending', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            const log1 = await git.log({ maxCount: 1 });
            const originalAuthor = log1.latest!.author_name;

            // Amend commit
            await git.raw(['commit', '--amend', '--no-edit']);

            // 验证 author 未更改
            const log2 = await git.log({ maxCount: 1 });
            expect(log2.latest!.author_name).toBe(originalAuthor);
        });
    });
});
