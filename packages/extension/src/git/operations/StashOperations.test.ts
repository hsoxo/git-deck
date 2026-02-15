import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StashOperations } from './StashOperations';
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

describe('StashOperations', () => {
    let git: SimpleGit;
    let stashOps: StashOperations;

    beforeEach(() => {
        git = {
            stashList: vi.fn(),
            stash: vi.fn(),
        } as any;

        stashOps = new StashOperations(git);
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should return stash list', async () => {
            vi.mocked(git.stashList).mockResolvedValue({
                all: [
                    { message: 'WIP on main', hash: 'abc123', date: '2024-01-01' },
                    { message: 'WIP on feature', hash: 'def456', date: '2024-01-02' },
                ],
            } as any);

            const stashes = await stashOps.list();

            expect(stashes).toHaveLength(2);
            expect(stashes[0]).toEqual({
                index: 0,
                message: 'WIP on main',
                hash: 'abc123',
                date: new Date('2024-01-01'),
            });
            expect(stashes[1]).toEqual({
                index: 1,
                message: 'WIP on feature',
                hash: 'def456',
                date: new Date('2024-01-02'),
            });
        });

        it('should return empty array when no stashes', async () => {
            vi.mocked(git.stashList).mockResolvedValue({ all: [] } as any);

            const stashes = await stashOps.list();

            expect(stashes).toEqual([]);
        });
    });

    describe('push', () => {
        it('should create stash without message', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.push();

            expect(git.stash).toHaveBeenCalledWith(['push']);
        });

        it('should create stash with message', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.push('My stash message');

            expect(git.stash).toHaveBeenCalledWith(['push', '-m', 'My stash message']);
        });

        it('should create stash with untracked files', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.push('My stash', true);

            expect(git.stash).toHaveBeenCalledWith([
                'push',
                '-m',
                'My stash',
                '--include-untracked',
            ]);
        });

        it('should create stash with untracked files but no message', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.push(undefined, true);

            expect(git.stash).toHaveBeenCalledWith(['push', '--include-untracked']);
        });
    });

    describe('pop', () => {
        it('should pop latest stash by default', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.pop();

            expect(git.stash).toHaveBeenCalledWith(['pop', 'stash@{0}']);
        });

        it('should pop specific stash', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.pop(2);

            expect(git.stash).toHaveBeenCalledWith(['pop', 'stash@{2}']);
        });
    });

    describe('apply', () => {
        it('should apply stash', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.apply(1);

            expect(git.stash).toHaveBeenCalledWith(['apply', 'stash@{1}']);
        });
    });

    describe('drop', () => {
        it('should drop stash', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.drop(0);

            expect(git.stash).toHaveBeenCalledWith(['drop', 'stash@{0}']);
        });
    });

    describe('clear', () => {
        it('should clear all stashes', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.clear();

            expect(git.stash).toHaveBeenCalledWith(['clear']);
        });
    });

    describe('branch', () => {
        it('should create branch from stash', async () => {
            vi.mocked(git.stash).mockResolvedValue('' as any);

            await stashOps.branch('new-branch', 0);

            expect(git.stash).toHaveBeenCalledWith(['branch', 'new-branch', 'stash@{0}']);
        });
    });
});
