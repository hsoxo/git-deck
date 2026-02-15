import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGitStore } from './gitStore';
import { rpcClient } from '../services/rpcClient';

// Mock RPC client
vi.mock('../services/rpcClient', () => ({
    rpcClient: {
        call: vi.fn(),
    },
}));

describe('gitStore', () => {
    beforeEach(() => {
        // 重置 store
        useGitStore.setState({
            status: null,
            commits: [],
            branches: [],
            selectedCommits: [],
            loading: false,
            error: null,
            hasMore: true,
            searchQuery: null,
        });

        vi.clearAllMocks();
    });

    describe('fetchStatus', () => {
        it('should fetch and update status', async () => {
            const mockStatus = {
                staged: ['file1.ts'],
                unstaged: ['file2.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };

            vi.mocked(rpcClient.call).mockResolvedValue(mockStatus);

            await useGitStore.getState().fetchStatus();

            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
            expect(useGitStore.getState().status).toEqual(mockStatus);
            expect(useGitStore.getState().loading).toBe(false);
        });

        it('should handle errors', async () => {
            vi.mocked(rpcClient.call).mockRejectedValue(new Error('Test error'));

            await useGitStore.getState().fetchStatus();

            expect(useGitStore.getState().error).toBe('Test error');
            expect(useGitStore.getState().loading).toBe(false);
        });
    });

    describe('fetchHistory', () => {
        it('should fetch commit history', async () => {
            const mockCommits = [
                { hash: 'abc123', message: 'Commit 1' },
                { hash: 'def456', message: 'Commit 2' },
            ];

            vi.mocked(rpcClient.call).mockResolvedValue(mockCommits);

            await useGitStore.getState().fetchHistory({ maxCount: 10 });

            expect(rpcClient.call).toHaveBeenCalledWith('git.getCommitLog', { maxCount: 10 });
            expect(useGitStore.getState().commits).toEqual(mockCommits);
        });

        it('should handle errors', async () => {
            vi.mocked(rpcClient.call).mockRejectedValue(new Error('Fetch error'));

            await useGitStore.getState().fetchHistory();

            expect(useGitStore.getState().error).toBe('Fetch error');
        });
    });

    describe('fetchBranches', () => {
        it('should fetch branches', async () => {
            const mockBranches = [
                { name: 'main', current: true, remote: false },
                { name: 'feature', current: false, remote: false },
            ];

            vi.mocked(rpcClient.call).mockResolvedValue(mockBranches);

            await useGitStore.getState().fetchBranches();

            expect(rpcClient.call).toHaveBeenCalledWith('git.getBranches');
            expect(useGitStore.getState().branches).toEqual(mockBranches);
        });
    });

    describe('stageFiles', () => {
        it('should stage files and refresh status', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().stageFiles(['file1.ts']);

            expect(rpcClient.call).toHaveBeenCalledWith('git.stageFiles', ['file1.ts']);
            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
        });

        it('should handle errors', async () => {
            vi.mocked(rpcClient.call).mockRejectedValue(new Error('Stage error'));

            await useGitStore.getState().stageFiles(['file1.ts']);

            expect(useGitStore.getState().error).toBe('Stage error');
        });
    });

    describe('unstageFiles', () => {
        it('should unstage files and refresh status', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().unstageFiles(['file1.ts']);

            expect(rpcClient.call).toHaveBeenCalledWith('git.unstageFiles', ['file1.ts']);
            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
        });
    });

    describe('stageAll', () => {
        it('should stage all files', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().stageAll();

            expect(rpcClient.call).toHaveBeenCalledWith('git.stageAll');
            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
        });
    });

    describe('unstageAll', () => {
        it('should unstage all files', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().unstageAll();

            expect(rpcClient.call).toHaveBeenCalledWith('git.unstageAll');
            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
        });
    });

    describe('commit', () => {
        it('should commit and refresh', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().commit('Test commit');

            expect(rpcClient.call).toHaveBeenCalledWith('git.commit', 'Test commit');
            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
        });
    });

    describe('discardFiles', () => {
        it('should discard files and refresh', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().discardFiles(['file1.ts']);

            expect(rpcClient.call).toHaveBeenCalledWith('git.discard', ['file1.ts']);
            expect(rpcClient.call).toHaveBeenCalledWith('git.getStatus');
        });
    });

    describe('selectCommit', () => {
        it('should select single commit', () => {
            useGitStore.getState().selectCommit('abc123', false);

            expect(useGitStore.getState().selectedCommits).toEqual(['abc123']);
        });

        it('should toggle commit in multi-select', () => {
            useGitStore.setState({ selectedCommits: ['abc123'] });

            useGitStore.getState().selectCommit('def456', true);
            expect(useGitStore.getState().selectedCommits).toEqual(['abc123', 'def456']);

            useGitStore.getState().selectCommit('abc123', true);
            expect(useGitStore.getState().selectedCommits).toEqual(['def456']);
        });
    });

    describe('clearSelection', () => {
        it('should clear selected commits', () => {
            useGitStore.setState({ selectedCommits: ['abc123', 'def456'] });

            useGitStore.getState().clearSelection();

            expect(useGitStore.getState().selectedCommits).toEqual([]);
        });
    });

    describe('amendCommit', () => {
        it('should amend commit with message', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().amendCommit('Amended message');

            expect(rpcClient.call).toHaveBeenCalledWith('git.amendCommit', 'Amended message');
        });

        it('should amend commit without message', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().amendCommit();

            expect(rpcClient.call).toHaveBeenCalledWith('git.amendCommit', undefined);
        });
    });

    describe('revertCommits', () => {
        it('should revert commits', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue(undefined);

            await useGitStore.getState().revertCommits(['abc123']);

            expect(rpcClient.call).toHaveBeenCalledWith('git.revert', ['abc123']);
        });
    });

    describe('getFileDiff', () => {
        it('should get file diff', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue('diff content');

            const diff = await useGitStore.getState().getFileDiff('file.ts', true);

            expect(rpcClient.call).toHaveBeenCalledWith('git.getFileDiff', 'file.ts', true);
            expect(diff).toBe('diff content');
        });

        it('should return empty string on error', async () => {
            vi.mocked(rpcClient.call).mockRejectedValue(new Error('Diff error'));

            const diff = await useGitStore.getState().getFileDiff('file.ts');

            expect(diff).toBe('');
        });
    });

    describe('searchCommits', () => {
        it('should search by message', async () => {
            const mockCommits = [{ hash: 'abc123', message: 'Test commit' }];
            vi.mocked(rpcClient.call).mockResolvedValue(mockCommits);

            await useGitStore.getState().searchCommits('Test', 'message');

            expect(rpcClient.call).toHaveBeenCalledWith('git.searchCommits', 'Test', {
                maxCount: 100,
            });
            expect(useGitStore.getState().searchQuery).toBe('Test');
        });

        it('should search by author', async () => {
            const mockCommits = [{ hash: 'abc123', author: 'John' }];
            vi.mocked(rpcClient.call).mockResolvedValue(mockCommits);

            await useGitStore.getState().searchCommits('John', 'author');

            expect(rpcClient.call).toHaveBeenCalledWith('git.getCommitsByAuthor', 'John', {
                maxCount: 100,
            });
        });

        it('should search by hash locally', async () => {
            useGitStore.setState({
                commits: [
                    { hash: 'abc123', shortHash: 'abc123' } as any,
                    { hash: 'def456', shortHash: 'def456' } as any,
                ],
            });

            await useGitStore.getState().searchCommits('abc', 'hash');

            const commits = useGitStore.getState().commits;
            expect(commits.length).toBe(1);
            expect(commits[0].hash).toBe('abc123');
        });
    });

    describe('clearSearch', () => {
        it('should clear search and reload', async () => {
            vi.mocked(rpcClient.call).mockResolvedValue([]);
            useGitStore.setState({ searchQuery: 'test' });

            await useGitStore.getState().clearSearch();

            expect(useGitStore.getState().searchQuery).toBeNull();
            expect(rpcClient.call).toHaveBeenCalledWith('git.getCommitLog', { maxCount: 100 });
        });
    });

    describe('loadMore', () => {
        it('should load more commits', async () => {
            const existingCommits = [{ hash: 'abc123' }];
            const newCommits = [{ hash: 'def456' }];

            useGitStore.setState({ commits: existingCommits as any, hasMore: true });
            vi.mocked(rpcClient.call).mockResolvedValue(newCommits);

            await useGitStore.getState().loadMore();

            expect(rpcClient.call).toHaveBeenCalledWith('git.getCommitLog', {
                maxCount: 50,
                skip: 1,
            });
            expect(useGitStore.getState().commits.length).toBe(2);
        });

        it('should not load when already loading', async () => {
            useGitStore.setState({ loading: true });

            await useGitStore.getState().loadMore();

            expect(rpcClient.call).not.toHaveBeenCalled();
        });

        it('should not load when no more commits', async () => {
            useGitStore.setState({ hasMore: false });

            await useGitStore.getState().loadMore();

            expect(rpcClient.call).not.toHaveBeenCalled();
        });

        it('should not load when searching', async () => {
            useGitStore.setState({ searchQuery: 'test' });

            await useGitStore.getState().loadMore();

            expect(rpcClient.call).not.toHaveBeenCalled();
        });

        it('should set hasMore to false when no new commits', async () => {
            useGitStore.setState({ commits: [{ hash: 'abc123' }] as any });
            vi.mocked(rpcClient.call).mockResolvedValue([]);

            await useGitStore.getState().loadMore();

            expect(useGitStore.getState().hasMore).toBe(false);
        });
    });
});
