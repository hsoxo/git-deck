import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';

describe('Git Operations Integration Tests', () => {
    let testRepoPath: string;
    let git: SimpleGit;

    beforeEach(async () => {
        // 创建临时测试仓库
        testRepoPath = path.join(os.tmpdir(), `git-gui-test-${Date.now()}`);
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

    describe('Stage and Commit', () => {
        it('should stage and commit files', async () => {
            // 创建测试文件
            const testFile = path.join(testRepoPath, 'test.txt');
            fs.writeFileSync(testFile, 'Hello World');

            // Stage 文件
            await git.add('test.txt');

            // 检查状态
            const status = await git.status();
            expect(status.staged).toContain('test.txt');

            // Commit
            await git.commit('Initial commit');

            // 验证 commit
            const log = await git.log();
            expect(log.latest?.message).toBe('Initial commit');
        });

        it('should unstage files', async () => {
            const testFile = path.join(testRepoPath, 'test.txt');
            fs.writeFileSync(testFile, 'Hello World');

            await git.add('test.txt');
            await git.reset(['HEAD', '--', 'test.txt']);

            const status = await git.status();
            expect(status.staged).not.toContain('test.txt');
            expect(status.not_added).toContain('test.txt');
        });
    });

    describe('Branch Operations', () => {
        it('should create and switch branches', async () => {
            // 创建初始 commit
            const testFile = path.join(testRepoPath, 'test.txt');
            fs.writeFileSync(testFile, 'Hello World');
            await git.add('test.txt');
            await git.commit('Initial commit');

            // 创建新分支
            await git.checkoutLocalBranch('feature-branch');

            const branches = await git.branch();
            expect(branches.current).toBe('feature-branch');
            expect(branches.all).toContain('feature-branch');
        });
    });

    describe('Stash Operations', () => {
        it('should stash and pop changes', async () => {
            // 创建初始 commit
            const testFile = path.join(testRepoPath, 'test.txt');
            fs.writeFileSync(testFile, 'Initial content');
            await git.add('test.txt');
            await git.commit('Initial commit');

            // 修改文件
            fs.writeFileSync(testFile, 'Modified content');

            // Stash
            await git.stash(['push', '-m', 'Test stash']);

            // 验证文件已恢复
            const content = fs.readFileSync(testFile, 'utf-8');
            expect(content).toBe('Initial content');

            // Pop stash
            await git.stash(['pop']);

            // 验证修改已恢复
            const modifiedContent = fs.readFileSync(testFile, 'utf-8');
            expect(modifiedContent).toBe('Modified content');
        });
    });
});
