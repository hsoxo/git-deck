import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RebaseOperations } from '../../../packages/extension/src/git/operations/RebaseOperations';

describe('Rebase Operations Integration Tests', () => {
    let git: SimpleGit;
    let rebaseOps: RebaseOperations;
    let testDir: string;

    beforeEach(async () => {
        // 创建临时测试目录
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-test-'));
        git = simpleGit(testDir);

        // 初始化 Git 仓库
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');
        await git.addConfig('init.defaultBranch', 'master');

        rebaseOps = new RebaseOperations(git, testDir);
    });

    afterEach(() => {
        // 清理测试目录
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('Normal Rebase', () => {
        it('should rebase branch onto another', async () => {
            // 创建初始提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 创建分支并添加提交
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
            await git.add('file2.txt');
            await git.commit('Feature commit');

            // 切换回 master 并添加提交
            await git.checkout('master');
            fs.writeFileSync(path.join(testDir, 'file3.txt'), 'content3');
            await git.add('file3.txt');
            await git.commit('Master commit');

            // 切换到 feature 并 rebase
            await git.checkout('feature');
            await rebaseOps.rebase('master', false);

            // 验证 rebase 成功
            const log = await git.log();
            expect(log.all.length).toBe(3);
            expect(log.all[0].message).toBe('Feature commit');
            expect(log.all[1].message).toBe('Master commit');
        });

        it('should abort rebase', async () => {
            // 创建初始提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 创建分支
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'feature content');
            await git.add('file1.txt');
            await git.commit('Feature commit');

            // 切换回 main 并修改同一文件
            await git.checkout('master');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'master content');
            await git.add('file1.txt');
            await git.commit('Master commit');

            // 切换到 feature 并尝试 rebase（会冲突）
            await git.checkout('feature');
            try {
                await rebaseOps.rebase('master', false);
            } catch (error) {
                // 预期会有冲突
            }

            // 中止 rebase
            await rebaseOps.abort();

            // 验证回到原始状态
            const status = await git.status();
            expect(status.conflicted.length).toBe(0);
        });
    });

    describe('Interactive Rebase', () => {
        it('should get rebase commits', async () => {
            // 创建多个提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Commit 1');

            fs.writeFileSync(path.join(testDir, 'file2.txt'), 'content2');
            await git.add('file2.txt');
            await git.commit('Commit 2');

            fs.writeFileSync(path.join(testDir, 'file3.txt'), 'content3');
            await git.add('file3.txt');
            await git.commit('Commit 3');

            // 获取第一个提交的 hash
            const log = await git.log();
            const firstCommit = log.all[log.all.length - 1].hash;

            // 获取可以 rebase 的 commits
            const commits = await rebaseOps.getRebaseCommits(firstCommit);

            expect(commits.length).toBe(2);
            expect(commits[0].message).toBe('Commit 3');
            expect(commits[1].message).toBe('Commit 2');
            expect(commits[0].action).toBe('pick');
        });
    });

    describe('Rebase State', () => {
        it('should detect rebase in progress', async () => {
            // 创建初始提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 创建分支
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'feature content');
            await git.add('file1.txt');
            await git.commit('Feature commit');

            // 切换回 main 并修改同一文件
            await git.checkout('master');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'master content');
            await git.add('file1.txt');
            await git.commit('Master commit');

            // 切换到 feature 并尝试 rebase（会冲突）
            await git.checkout('feature');
            try {
                await rebaseOps.rebase('master', false);
            } catch (error) {
                // 预期会有冲突
            }

            // 检查是否正在 rebase
            const isRebasing = await rebaseOps.isRebasing();
            expect(isRebasing).toBe(true);

            // 清理
            await rebaseOps.abort();
        });

        it('should get rebase state', async () => {
            const state = rebaseOps.getState();
            expect(state.type).toBe('idle');
        });
    });

    describe('Conflict Handling', () => {
        it('should handle rebase conflicts', async () => {
            // 创建初始提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 创建分支
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'feature content');
            await git.add('file1.txt');
            await git.commit('Feature commit');

            // 切换回 master 并修改同一文件
            await git.checkout('master');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'master content');
            await git.add('file1.txt');
            await git.commit('Master commit');

            // 切换到 feature 并尝试 rebase
            await git.checkout('feature');
            let hasConflict = false;
            try {
                await rebaseOps.rebase('master', false);
            } catch (error: any) {
                hasConflict = true;
                expect(error.name).toBe('RebaseConflictError');
                expect(error.files).toContain('file1.txt');
            }

            expect(hasConflict).toBe(true);

            // 验证状态
            const state = rebaseOps.getState();
            expect(state.type).toBe('conflict');

            // 清理
            await rebaseOps.abort();
        });

        it.skip('should continue after resolving conflicts', async () => {
            // 创建初始提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 创建分支
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'feature content');
            await git.add('file1.txt');
            await git.commit('Feature commit');

            // 切换回 master 并修改同一文件
            await git.checkout('master');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'master content');
            await git.add('file1.txt');
            await git.commit('Master commit');

            // 切换到 feature 并尝试 rebase
            await git.checkout('feature');
            try {
                await rebaseOps.rebase('master', false);
            } catch (error) {
                // 预期会有冲突
            }

            // 解决冲突
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'resolved content');
            await git.add('file1.txt');

            // 继续 rebase
            await rebaseOps.continue();

            // 验证 rebase 完成
            const state = rebaseOps.getState();
            expect(state.type).toBe('completed');
        }, 10000);

        it('should skip commit during rebase', async () => {
            // 创建初始提交
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 创建分支
            await git.checkoutLocalBranch('feature');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'feature content');
            await git.add('file1.txt');
            await git.commit('Feature commit');

            // 切换回 master 并修改同一文件
            await git.checkout('master');
            fs.writeFileSync(path.join(testDir, 'file1.txt'), 'master content');
            await git.add('file1.txt');
            await git.commit('Master commit');

            // 切换到 feature 并尝试 rebase
            await git.checkout('feature');
            try {
                await rebaseOps.rebase('master', false);
            } catch (error) {
                // 预期会有冲突
            }

            // 跳过当前 commit
            await rebaseOps.skip();

            // 验证跳过成功（不会有冲突）
            const status = await git.status();
            expect(status.conflicted.length).toBe(0);
        });
    });
});
