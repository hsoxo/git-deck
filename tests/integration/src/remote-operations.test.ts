import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RemoteOperations } from '../../packages/extension/src/git/operations/RemoteOperations';
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('RemoteOperations Integration Tests', () => {
    let git: SimpleGit;
    let remoteOps: RemoteOperations;
    let testDir: string;
    let remoteDir: string;

    beforeEach(async () => {
        // Create test directories
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-remote-test-'));
        remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-remote-bare-'));

        // Initialize bare remote repository
        const remoteGit = simpleGit(remoteDir);
        await remoteGit.init(true);

        // Initialize local repository
        git = simpleGit(testDir);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        // Create initial commit
        const testFile = path.join(testDir, 'test.txt');
        fs.writeFileSync(testFile, 'test content');
        await git.add('test.txt');
        await git.commit('Initial commit');

        remoteOps = new RemoteOperations(git);
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        if (fs.existsSync(remoteDir)) {
            fs.rmSync(remoteDir, { recursive: true, force: true });
        }
    });

    describe('Remote Management', () => {
        it('should add and list remotes', async () => {
            await remoteOps.addRemote('origin', remoteDir);

            const remotes = await remoteOps.listRemotes();

            expect(remotes).toHaveLength(1);
            expect(remotes[0].name).toBe('origin');
            expect(remotes[0].fetchUrl).toBe(remoteDir);
        });

        it('should add multiple remotes', async () => {
            await remoteOps.addRemote('origin', remoteDir);
            await remoteOps.addRemote('upstream', remoteDir);

            const remotes = await remoteOps.listRemotes();

            expect(remotes).toHaveLength(2);
            expect(remotes.map((r) => r.name)).toContain('origin');
            expect(remotes.map((r) => r.name)).toContain('upstream');
        });

        it('should remove remote', async () => {
            await remoteOps.addRemote('origin', remoteDir);
            await remoteOps.removeRemote('origin');

            const remotes = await remoteOps.listRemotes();

            expect(remotes).toHaveLength(0);
        });

        it('should handle SSH URLs', async () => {
            const sshUrl = 'git@github.com:user/repo.git';
            await remoteOps.addRemote('origin', sshUrl);

            const remotes = await remoteOps.listRemotes();

            expect(remotes[0].fetchUrl).toBe(sshUrl);
        });

        it('should handle HTTPS URLs', async () => {
            const httpsUrl = 'https://github.com/user/repo.git';
            await remoteOps.addRemote('origin', httpsUrl);

            const remotes = await remoteOps.listRemotes();

            expect(remotes[0].fetchUrl).toBe(httpsUrl);
        });
    });

    describe('Push Operations', () => {
        beforeEach(async () => {
            await remoteOps.addRemote('origin', remoteDir);
        });

        it('should push to remote', async () => {
            await remoteOps.push('origin', 'master', false, true);

            // Verify push succeeded by checking remote
            const remoteGit = simpleGit(remoteDir);
            const branches = await remoteGit.branch();
            expect(branches.all).toContain('master');
        });

        it('should push with set-upstream', async () => {
            await remoteOps.push('origin', 'master', false, true);

            // Verify tracking is set
            const status = await git.status();
            expect(status.tracking).toBe('origin/master');
        });
    });

    describe('Fetch Operations', () => {
        beforeEach(async () => {
            await remoteOps.addRemote('origin', remoteDir);
            await remoteOps.push('origin', 'master', false, true);
        });

        it('should fetch from remote', async () => {
            // Create a new commit in remote
            const remoteGit = simpleGit(remoteDir);
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-temp-'));
            const tempGit = simpleGit(tempDir);
            await tempGit.clone(remoteDir, tempDir);
            await tempGit.addConfig('user.name', 'Test User');
            await tempGit.addConfig('user.email', 'test@example.com');
            const newFile = path.join(tempDir, 'new.txt');
            fs.writeFileSync(newFile, 'new content');
            await tempGit.add('new.txt');
            await tempGit.commit('New commit');
            await tempGit.push('origin', 'master');

            // Fetch in test repo
            await remoteOps.fetch('origin');

            // Verify fetch succeeded
            const log = await git.log(['origin/master']);
            expect(log.all).toHaveLength(2);

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('should fetch with prune', async () => {
            await remoteOps.fetch('origin', true);

            // Verify fetch succeeded
            const branches = await git.branch(['-r']);
            expect(branches.all).toContain('origin/master');
        });
    });

    describe('Pull Operations', () => {
        beforeEach(async () => {
            await remoteOps.addRemote('origin', remoteDir);
            await remoteOps.push('origin', 'master', false, true);
        });

        it('should pull from remote', async () => {
            // Create a new commit in remote
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-temp-'));
            const tempGit = simpleGit(tempDir);
            await tempGit.clone(remoteDir, tempDir);
            await tempGit.addConfig('user.name', 'Test User');
            await tempGit.addConfig('user.email', 'test@example.com');
            const newFile = path.join(tempDir, 'new.txt');
            fs.writeFileSync(newFile, 'new content');
            await tempGit.add('new.txt');
            await tempGit.commit('New commit');
            await tempGit.push('origin', 'master');

            // Pull in test repo
            await remoteOps.pull('origin', 'master');

            // Verify pull succeeded
            const log = await git.log();
            expect(log.all).toHaveLength(2);
            expect(fs.existsSync(path.join(testDir, 'new.txt'))).toBe(true);

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid remote name', async () => {
            await expect(remoteOps.addRemote('origin/master', 'url')).rejects.toThrow();
        });

        it('should handle empty URL', async () => {
            await expect(remoteOps.addRemote('origin', '')).rejects.toThrow();
        });

        it('should handle non-existent remote', async () => {
            await expect(remoteOps.fetch('nonexistent')).rejects.toThrow();
        });

        it('should handle push to non-existent remote', async () => {
            await expect(remoteOps.push('nonexistent')).rejects.toThrow();
        });
    });
});
