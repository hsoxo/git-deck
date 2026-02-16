import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RebaseOperations, RebaseConflictError } from './RebaseOperations';
import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs');
vi.mock('../../utils/Logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('RebaseOperations', () => {
    let git: SimpleGit;
    let rebaseOps: RebaseOperations;
    const repoPath = '/test/repo';

    beforeEach(() => {
        git = {
            rebase: vi.fn(),
            log: vi.fn(),
            status: vi.fn(),
            raw: vi.fn(),
            env: vi.fn(),
        } as any;

        rebaseOps = new RebaseOperations(git, repoPath);
        vi.clearAllMocks();
    });

    describe('rebase', () => {
        it('should perform normal rebase', async () => {
            vi.mocked(git.log).mockResolvedValue({
                all: [{ hash: 'abc123' }, { hash: 'def456' }],
            } as any);
            vi.mocked(git.rebase).mockResolvedValue('' as any);

            await rebaseOps.rebase('main', false);

            expect(git.log).toHaveBeenCalledWith({ from: 'main', to: 'HEAD' });
            expect(git.rebase).toHaveBeenCalledWith(['main']);
            expect(rebaseOps.getState()).toEqual({ type: 'completed' });
        });

        it('should perform interactive rebase', async () => {
            vi.mocked(git.log).mockResolvedValue({
                all: [{ hash: 'abc123' }],
            } as any);
            vi.mocked(git.rebase).mockResolvedValue('' as any);

            await rebaseOps.rebase('main', true);

            expect(git.rebase).toHaveBeenCalledWith(['-i', 'main']);
        });

        it('should handle conflicts', async () => {
            vi.mocked(git.log).mockResolvedValue({
                all: [{ hash: 'abc123' }],
            } as any);
            vi.mocked(git.rebase).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt', 'file2.txt'],
            } as any);

            await expect(rebaseOps.rebase('main', false)).rejects.toThrow(RebaseConflictError);
            expect(rebaseOps.getState()).toEqual({
                type: 'conflict',
                files: ['file1.txt', 'file2.txt'],
            });
        });
    });

    describe('interactiveRebase', () => {
        it('should perform interactive rebase with custom commits', async () => {
            const commits = [
                {
                    hash: 'abc123',
                    shortHash: 'abc123',
                    message: 'Commit 1',
                    action: 'pick' as const,
                },
                {
                    hash: 'def456',
                    shortHash: 'def456',
                    message: 'Commit 2',
                    action: 'squash' as const,
                },
            ];

            // Mock fs functions for temp file creation
            const tmpDir = '/tmp/git-rebase-test';
            vi.mocked(fs.mkdtempSync).mockReturnValue(tmpDir);
            vi.mocked(fs.writeFileSync).mockImplementation(() => {});
            vi.mocked(fs.chmodSync).mockImplementation(() => {});
            vi.mocked(fs.unlinkSync).mockImplementation(() => {});
            vi.mocked(fs.rmdirSync).mockImplementation(() => {});

            // Mock git.env to return a chainable object
            const envGit = {
                rebase: vi.fn().mockResolvedValue(''),
            };
            vi.mocked(git.env).mockReturnValue(envGit as any);

            await rebaseOps.interactiveRebase('main', commits);

            expect(git.env).toHaveBeenCalled();
            expect(envGit.rebase).toHaveBeenCalledWith(['-i', 'main']);
            expect(rebaseOps.getState()).toEqual({ type: 'completed' });
        });
    });

    describe('continue', () => {
        it('should continue rebase after conflict resolution', async () => {
            // Set conflict state
            vi.mocked(git.log).mockResolvedValue({ all: [{ hash: 'abc123' }] } as any);
            vi.mocked(git.rebase).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({ conflicted: ['file1.txt'] } as any);

            await expect(rebaseOps.rebase('main', false)).rejects.toThrow();

            // Continue
            vi.mocked(git.rebase).mockResolvedValue('' as any);
            vi.mocked(git.status).mockResolvedValue({ conflicted: [] } as any);

            await rebaseOps.continue();

            expect(git.rebase).toHaveBeenCalledWith(['--continue']);
            expect(rebaseOps.getState()).toEqual({ type: 'completed' });
        });

        it('should throw error if not in conflict state', async () => {
            await expect(rebaseOps.continue()).rejects.toThrow('Not in conflict state');
        });
    });

    describe('abort', () => {
        it('should abort rebase', async () => {
            vi.mocked(git.rebase).mockResolvedValue('' as any);

            await rebaseOps.abort();

            expect(git.rebase).toHaveBeenCalledWith(['--abort']);
            expect(rebaseOps.getState()).toEqual({ type: 'aborted' });
        });
    });

    describe('skip', () => {
        it('should skip current commit', async () => {
            vi.mocked(git.rebase).mockResolvedValue('' as any);

            await rebaseOps.skip();

            expect(git.rebase).toHaveBeenCalledWith(['--skip']);
        });
    });

    describe('editCommit', () => {
        it('should edit commit message', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);
            vi.mocked(git.rebase).mockResolvedValue('' as any);

            await rebaseOps.editCommit('New message');

            expect(git.raw).toHaveBeenCalledWith(['commit', '--amend', '-m', 'New message']);
            expect(git.rebase).toHaveBeenCalledWith(['--continue']);
        });
    });

    describe('isRebasing', () => {
        it('should return true if rebase-merge exists', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = await rebaseOps.isRebasing();

            expect(result).toBe(true);
        });

        it('should return false if no rebase in progress', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const result = await rebaseOps.isRebasing();

            expect(result).toBe(false);
        });
    });

    describe('getRebaseProgress', () => {
        it('should return progress information', async () => {
            vi.mocked(fs.existsSync).mockImplementation((path: any) => {
                return path.includes('rebase-merge');
            });
            vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
                if (path.includes('msgnum')) {
                    return '3';
                }
                if (path.includes('end')) {
                    return '10';
                }
                if (path.includes('head-name')) {
                    return 'refs/heads/feature';
                }
                return '';
            });

            const progress = await rebaseOps.getRebaseProgress();

            expect(progress).toEqual({
                current: 3,
                total: 10,
                currentCommit: 'refs/heads/feature',
            });
        });

        it('should return null if not rebasing', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const progress = await rebaseOps.getRebaseProgress();

            expect(progress).toBeNull();
        });
    });

    describe('getRebaseCommits', () => {
        it('should return commits to be rebased', async () => {
            vi.mocked(git.log).mockResolvedValue({
                all: [
                    { hash: 'abc123', message: 'Commit 1' },
                    { hash: 'def456', message: 'Commit 2' },
                ],
            } as any);

            const commits = await rebaseOps.getRebaseCommits('main');

            expect(commits).toEqual([
                { hash: 'abc123', shortHash: 'abc123', message: 'Commit 1', action: 'pick' },
                { hash: 'def456', shortHash: 'def456', message: 'Commit 2', action: 'pick' },
            ]);
        });
    });
});
