import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RevertOperations, RevertConflictError } from './RevertOperations';
import simpleGit, { SimpleGit } from 'simple-git';

vi.mock('../../utils/Logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../utils/ErrorHandler', () => ({
    ErrorHandler: {
        createUserMessage: vi.fn((error) => String(error)),
    },
}));

describe('RevertOperations', () => {
    let git: SimpleGit;
    let revertOps: RevertOperations;

    beforeEach(() => {
        git = {
            raw: vi.fn(),
            status: vi.fn(),
        } as any;

        revertOps = new RevertOperations(git);
        vi.clearAllMocks();
    });

    describe('revert', () => {
        it('should revert a single commit', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await revertOps.revert(['abc123']);

            expect(git.raw).toHaveBeenCalledWith(['revert', '--no-edit', 'abc123']);
            expect(revertOps.getState()).toEqual({ type: 'completed' });
        });

        it('should revert multiple commits in reverse order', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await revertOps.revert(['abc123', 'def456', 'ghi789']);

            expect(git.raw).toHaveBeenCalledTimes(3);
            expect(git.raw).toHaveBeenNthCalledWith(1, ['revert', '--no-edit', 'ghi789']);
            expect(git.raw).toHaveBeenNthCalledWith(2, ['revert', '--no-edit', 'def456']);
            expect(git.raw).toHaveBeenNthCalledWith(3, ['revert', '--no-edit', 'abc123']);
            expect(revertOps.getState()).toEqual({ type: 'completed' });
        });

        it('should allow editing commit message', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await revertOps.revert(['abc123'], false);

            expect(git.raw).toHaveBeenCalledWith(['revert', '--edit', 'abc123']);
        });

        it('should handle conflicts', async () => {
            vi.mocked(git.raw).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt'],
            } as any);

            await expect(revertOps.revert(['abc123'])).rejects.toThrow(RevertConflictError);

            const state = revertOps.getState();
            expect(state.type).toBe('conflict');
            if (state.type === 'conflict') {
                expect(state.commit).toBe('abc123');
                expect(state.files).toEqual(['file1.txt']);
            }
        });
    });

    describe('revertNoCommit', () => {
        it('should revert without committing', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await revertOps.revertNoCommit('abc123');

            expect(git.raw).toHaveBeenCalledWith(['revert', '--no-commit', 'abc123']);
        });
    });

    describe('continue', () => {
        it('should continue revert', async () => {
            // Set up conflict state first
            vi.mocked(git.raw).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt'],
            } as any);

            await expect(revertOps.revert(['abc123'])).rejects.toThrow();

            // Now continue
            vi.mocked(git.raw).mockResolvedValue('' as any);
            vi.mocked(git.status).mockResolvedValue({ conflicted: [] } as any);

            await revertOps.continue();

            expect(git.raw).toHaveBeenCalledWith(['revert', '--continue']);
            expect(revertOps.getState()).toEqual({ type: 'completed' });
        });

        it('should throw error if not in conflict state', async () => {
            await expect(revertOps.continue()).rejects.toThrow('Not in conflict state');
        });
    });

    describe('abort', () => {
        it('should abort revert', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await revertOps.abort();

            expect(git.raw).toHaveBeenCalledWith(['revert', '--abort']);
            expect(revertOps.getState()).toEqual({ type: 'aborted' });
        });
    });

    describe('skip', () => {
        it('should skip current commit', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await revertOps.skip();

            expect(git.raw).toHaveBeenCalledWith(['revert', '--skip']);
        });
    });

    describe('getState', () => {
        it('should return idle state initially', () => {
            expect(revertOps.getState()).toEqual({ type: 'idle' });
        });
    });
});
