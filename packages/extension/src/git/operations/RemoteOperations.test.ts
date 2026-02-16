import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoteOperations } from './RemoteOperations.js';
import type { SimpleGit } from 'simple-git';

describe('RemoteOperations', () => {
    let remoteOps: RemoteOperations;
    let mockGit: SimpleGit;

    beforeEach(() => {
        mockGit = {
            getRemotes: vi.fn(),
            addRemote: vi.fn(),
            removeRemote: vi.fn(),
            fetch: vi.fn(),
            pull: vi.fn(),
            push: vi.fn(),
        } as unknown as SimpleGit;

        remoteOps = new RemoteOperations(mockGit);
    });

    describe('listRemotes', () => {
        it('should list all remotes', async () => {
            vi.mocked(mockGit.getRemotes).mockResolvedValue([
                { name: 'origin', refs: { fetch: 'git@github.com:user/repo.git', push: 'git@github.com:user/repo.git' } },
                { name: 'upstream', refs: { fetch: 'https://github.com/upstream/repo.git', push: 'https://github.com/upstream/repo.git' } },
            ] as never);

            const remotes = await remoteOps.listRemotes();

            expect(remotes).toHaveLength(2);
            expect(remotes[0]).toEqual({
                name: 'origin',
                fetchUrl: 'git@github.com:user/repo.git',
                pushUrl: 'git@github.com:user/repo.git',
            });
        });
    });

    describe('addRemote', () => {
        it('should add a remote', async () => {
            await remoteOps.addRemote('origin', 'git@github.com:user/repo.git');

            expect(mockGit.addRemote).toHaveBeenCalledWith('origin', 'git@github.com:user/repo.git');
        });

        it('should reject invalid remote name', async () => {
            await expect(remoteOps.addRemote('origin/master', 'url')).rejects.toThrow();
        });

        it('should reject empty URL', async () => {
            await expect(remoteOps.addRemote('origin', '')).rejects.toThrow('Remote URL cannot be empty');
        });
    });

    describe('removeRemote', () => {
        it('should remove a remote', async () => {
            await remoteOps.removeRemote('origin');

            expect(mockGit.removeRemote).toHaveBeenCalledWith('origin');
        });

        it('should reject invalid remote name', async () => {
            await expect(remoteOps.removeRemote('origin/master')).rejects.toThrow();
        });
    });

    describe('fetch', () => {
        it('should fetch from default remote', async () => {
            await remoteOps.fetch();

            expect(mockGit.fetch).toHaveBeenCalledWith(['origin']);
        });

        it('should fetch from specified remote', async () => {
            await remoteOps.fetch('upstream');

            expect(mockGit.fetch).toHaveBeenCalledWith(['upstream']);
        });

        it('should fetch with prune', async () => {
            await remoteOps.fetch('origin', true);

            expect(mockGit.fetch).toHaveBeenCalledWith(['origin', '--prune']);
        });

        it('should reject invalid remote name', async () => {
            await expect(remoteOps.fetch('origin/master')).rejects.toThrow();
        });
    });

    describe('pull', () => {
        it('should pull from default remote', async () => {
            await remoteOps.pull();

            expect(mockGit.pull).toHaveBeenCalledWith(['origin']);
        });

        it('should pull from specified remote and branch', async () => {
            await remoteOps.pull('upstream', 'main');

            expect(mockGit.pull).toHaveBeenCalledWith(['upstream', 'main']);
        });

        it('should pull with rebase', async () => {
            await remoteOps.pull('origin', 'main', true);

            expect(mockGit.pull).toHaveBeenCalledWith(['--rebase', 'origin', 'main']);
        });

        it('should reject invalid remote name', async () => {
            await expect(remoteOps.pull('origin/master')).rejects.toThrow();
        });

        it('should reject invalid branch name', async () => {
            await expect(remoteOps.pull('origin', 'invalid branch')).rejects.toThrow();
        });
    });

    describe('push', () => {
        it('should push to default remote', async () => {
            await remoteOps.push();

            expect(mockGit.push).toHaveBeenCalledWith(['origin']);
        });

        it('should push to specified remote and branch', async () => {
            await remoteOps.push('upstream', 'main');

            expect(mockGit.push).toHaveBeenCalledWith(['upstream', 'main']);
        });

        it('should push with force', async () => {
            await remoteOps.push('origin', 'main', true);

            expect(mockGit.push).toHaveBeenCalledWith(['origin', 'main', '--force']);
        });

        it('should push with set-upstream', async () => {
            await remoteOps.push('origin', 'main', false, true);

            expect(mockGit.push).toHaveBeenCalledWith(['origin', 'main', '--set-upstream']);
        });

        it('should reject invalid remote name', async () => {
            await expect(remoteOps.push('origin/master')).rejects.toThrow();
        });

        it('should reject invalid branch name', async () => {
            await expect(remoteOps.push('origin', 'invalid branch')).rejects.toThrow();
        });
    });
});
