import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CherryPickOperations, CherryPickConflictError } from './CherryPickOperations';
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

describe('CherryPickOperations', () => {
    let git: SimpleGit;
    let cherryPickOps: CherryPickOperations;

    beforeEach(() => {
        git = {
            raw: vi.fn(),
            status: vi.fn(),
        } as any;

        cherryPickOps = new CherryPickOperations(git);
        vi.clearAllMocks();
    });

    describe('cherryPick', () => {
        it('should cherry-pick single commit', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await cherryPickOps.cherryPick(['abc123']);

            expect(git.raw).toHaveBeenCalledWith(['cherry-pick', 'abc123']);
            expect(cherryPickOps.getState()).toEqual({ type: 'completed' });
        });

        it('should cherry-pick multiple commits', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await cherryPickOps.cherryPick(['abc123', 'def456', 'ghi789']);

            expect(git.raw).toHaveBeenCalledTimes(3);
            expect(git.raw).toHaveBeenNthCalledWith(1, ['cherry-pick', 'abc123']);
            expect(git.raw).toHaveBeenNthCalledWith(2, ['cherry-pick', 'def456']);
            expect(git.raw).toHaveBeenNthCalledWith(3, ['cherry-pick', 'ghi789']);
            expect(cherryPickOps.getState()).toEqual({ type: 'completed' });
        });

        it('should handle conflicts', async () => {
            vi.mocked(git.raw).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt', 'file2.txt'],
            } as any);

            await expect(cherryPickOps.cherryPick(['abc123'])).rejects.toThrow(
                CherryPickConflictError
            );

            const state = cherryPickOps.getState();
            expect(state.type).toBe('conflict');
            if (state.type === 'conflict') {
                expect(state.commit).toBe('abc123');
                expect(state.files).toEqual(['file1.txt', 'file2.txt']);
            }
        });

        it('should update state during multi-commit cherry-pick', async () => {
            let callCount = 0;
            vi.mocked(git.raw).mockImplementation(async () => {
                callCount++;
                if (callCount === 2) {
                    throw new Error('Conflict');
                }
                return '' as any;
            });

            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt'],
            } as any);

            await expect(
                cherryPickOps.cherryPick(['abc123', 'def456', 'ghi789'])
            ).rejects.toThrow();

            const state = cherryPickOps.getState();
            expect(state.type).toBe('conflict');
            if (state.type === 'conflict') {
                expect(state.commit).toBe('def456');
            }
        });
    });

    describe('continue', () => {
        it('should continue after resolving conflicts', async () => {
            // Set up conflict state
            vi.mocked(git.raw).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt'],
            } as any);

            await expect(cherryPickOps.cherryPick(['abc123'])).rejects.toThrow();

            // Continue
            vi.mocked(git.raw).mockResolvedValue('' as any);
            vi.mocked(git.status).mockResolvedValue({ conflicted: [] } as any);

            await cherryPickOps.continue();

            expect(git.raw).toHaveBeenCalledWith(['cherry-pick', '--continue']);
            expect(cherryPickOps.getState()).toEqual({ type: 'completed' });
        });

        it('should throw error if not in conflict state', async () => {
            await expect(cherryPickOps.continue()).rejects.toThrow('Not in conflict state');
        });

        it('should handle new conflicts during continue', async () => {
            // Set up conflict state
            vi.mocked(git.raw).mockRejectedValue(new Error('Conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file1.txt'],
            } as any);

            await expect(cherryPickOps.cherryPick(['abc123'])).rejects.toThrow();

            // Continue but hit another conflict
            vi.mocked(git.raw).mockRejectedValue(new Error('Another conflict'));
            vi.mocked(git.status).mockResolvedValue({
                conflicted: ['file2.txt'],
            } as any);

            await expect(cherryPickOps.continue()).rejects.toThrow(CherryPickConflictError);
        });
    });

    describe('abort', () => {
        it('should abort cherry-pick', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await cherryPickOps.abort();

            expect(git.raw).toHaveBeenCalledWith(['cherry-pick', '--abort']);
            expect(cherryPickOps.getState()).toEqual({ type: 'aborted' });
        });
    });

    describe('skip', () => {
        it('should skip current commit', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await cherryPickOps.skip();

            expect(git.raw).toHaveBeenCalledWith(['cherry-pick', '--skip']);
        });
    });

    describe('getState', () => {
        it('should return idle state initially', () => {
            expect(cherryPickOps.getState()).toEqual({ type: 'idle' });
        });

        it('should return completed state after successful operation', async () => {
            vi.mocked(git.raw).mockResolvedValue('' as any);

            await cherryPickOps.cherryPick(['abc123']);

            const state = cherryPickOps.getState();
            expect(state.type).toBe('completed');
        });
    });
});
