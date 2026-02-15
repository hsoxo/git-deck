import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';

describe('Revert Operations Integration Tests', () => {
    let testRepoPath: string;
    let git: SimpleGit;

    beforeEach(async () => {
        // 创建临时测试仓库
        testRepoPath = path.join(os.tmpdir(), `git-gui-revert-test-${Date.now()}`);
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

    describe('Revert Single Commit', () => {
        it('should revert a single commit', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Initial content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改文件并提交
            fs.writeFileSync(file1, 'Modified content');
            await git.add('file1.txt');
            await git.commit('Modify file1');

            // 获取最后一个 commit 的 hash
            const log = await git.log();
            const lastCommitHash = log.latest!.hash;

            // Revert 最后一个 commit
            await git.revert(lastCommitHash, ['--no-edit']);

            // 验证文件内容已恢复
            const content = fs.readFileSync(file1, 'utf-8');
            expect(content).toBe('Initial content');

            // 验证创建了 revert commit
            const newLog = await git.log();
            expect(newLog.total).toBe(3);
            expect(newLog.latest!.message).toContain('Revert');
        });

        it('should revert without committing', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Initial content');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改文件并提交
            fs.writeFileSync(file1, 'Modified content');
            await git.add('file1.txt');
            await git.commit('Modify file1');

            // 获取最后一个 commit 的 hash
            const log = await git.log();
            const lastCommitHash = log.latest!.hash;

            // Revert 但不提交
            await git.raw(['revert', '--no-commit', lastCommitHash]);

            // 验证文件内容已恢复
            const content = fs.readFileSync(file1, 'utf-8');
            expect(content).toBe('Initial content');

            // 验证有 staged 的改动
            const status = await git.status();
            expect(status.files.length).toBeGreaterThan(0);
        });
    });

    describe('Revert Multiple Commits', () => {
        it('should revert multiple commits in reverse order', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Version 1');
            await git.add('file1.txt');
            await git.commit('Commit 1');

            // 第二个 commit
            fs.writeFileSync(file1, 'Version 2');
            await git.add('file1.txt');
            await git.commit('Commit 2');

            // 第三个 commit
            fs.writeFileSync(file1, 'Version 3');
            await git.add('file1.txt');
            await git.commit('Commit 3');

            // 获取最后两个 commits
            const log = await git.log({ maxCount: 2 });
            const commits = log.all.map((c) => c.hash);

            // Revert 最后两个 commits（应该按反序）
            // 先 revert 最新的，再 revert 次新的
            await git.revert(commits[0], ['--no-edit']);
            await git.revert(commits[1], ['--no-edit']);

            // 验证文件内容恢复到第一个版本
            const content = fs.readFileSync(file1, 'utf-8');
            expect(content).toBe('Version 1');

            // 验证创建了两个 revert commits
            const newLog = await git.log();
            expect(newLog.total).toBe(5); // 3 original + 2 revert
        });
    });

    describe('Revert with Conflicts', () => {
        it('should detect conflicts during revert', async () => {
            // 创建初始 commit
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Line 1\nLine 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            // 修改中间行
            fs.writeFileSync(file1, 'Line 1\nModified Line 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Modify line 2');

            // 再次修改同一行
            fs.writeFileSync(file1, 'Line 1\nDifferent Line 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Modify line 2 again');

            // 获取中间 commit 的 hash
            const log = await git.log({ maxCount: 2 });
            const middleCommit = log.all[1].hash;

            // 尝试 revert 中间 commit（应该产生冲突）
            try {
                await git.revert(middleCommit, ['--no-edit']);
                // 如果没有冲突，测试失败
                expect.fail('Should have conflicts');
            } catch (error) {
                // 验证有冲突
                const status = await git.status();
                expect(status.conflicted.length).toBeGreaterThan(0);
            }
        });

        it('should abort revert on conflict', async () => {
            // 创建会产生冲突的场景
            const file1 = path.join(testRepoPath, 'file1.txt');
            fs.writeFileSync(file1, 'Line 1\nLine 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Initial commit');

            fs.writeFileSync(file1, 'Line 1\nModified Line 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Modify line 2');

            fs.writeFileSync(file1, 'Line 1\nDifferent Line 2\nLine 3');
            await git.add('file1.txt');
            await git.commit('Modify line 2 again');

            const log = await git.log({ maxCount: 2 });
            const middleCommit = log.all[1].hash;

            // 产生冲突
            try {
                await git.revert(middleCommit, ['--no-edit']);
            } catch (error) {
                // 中止 revert
                await git.raw(['revert', '--abort']);

                // 验证状态已恢复
                const status = await git.status();
                expect(status.conflicted.length).toBe(0);
                expect(status.modified.length).toBe(0);
            }
        });
    });
});
