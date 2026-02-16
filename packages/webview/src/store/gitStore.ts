import { create } from 'zustand';
import type { GitStatus, CommitNode, BranchInfo, RemoteInfo } from '@git-gui/shared';
import { rpcClient } from '../services/rpcClient';

interface GitState {
    status: GitStatus | null;
    commits: CommitNode[];
    branches: BranchInfo[];
    selectedCommits: string[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    searchQuery: string | null;

    // Actions
    fetchStatus: () => Promise<void>;
    fetchHistory: (options?: any) => Promise<void>;
    fetchBranches: () => Promise<void>;
    stageFiles: (files: string[]) => Promise<void>;
    unstageFiles: (files: string[]) => Promise<void>;
    stageAll: () => Promise<void>;
    unstageAll: () => Promise<void>;
    commit: (message: string) => Promise<void>;
    discardFiles: (files: string[]) => Promise<void>;
    selectCommit: (hash: string, multi: boolean) => void;
    clearSelection: () => void;
    amendCommit: (message?: string) => Promise<void>;
    revertCommits: (commits: string[]) => Promise<void>;
    getFileDiff: (file: string, staged?: boolean) => Promise<string>;
    searchCommits: (query: string, type: 'message' | 'author' | 'hash') => Promise<void>;
    clearSearch: () => Promise<void>;
    loadMore: () => Promise<void>;
    startRebase: (onto: string, interactive: boolean, commits?: any[]) => Promise<void>;
    continueRebase: () => Promise<void>;
    abortRebase: () => Promise<void>;
    skipRebase: () => Promise<void>;
    getRebaseState: () => Promise<any>;
    isRebasing: () => Promise<boolean>;
    cherryPick: (commits: string[]) => Promise<void>;
    getStashes: () => Promise<any[]>;
    createStash: (message?: string, includeUntracked?: boolean) => Promise<void>;
    applyStash: (index: number) => Promise<void>;
    popStash: (index: number) => Promise<void>;
    dropStash: (index: number) => Promise<void>;
    currentBranch: string | null;
    createBranch: (name: string, startPoint?: string) => Promise<void>;
    deleteBranch: (name: string, force?: boolean) => Promise<void>;
    renameBranch: (oldName: string, newName: string, force?: boolean) => Promise<void>;
    checkoutBranch: (name: string, create?: boolean) => Promise<void>;
    mergeBranch: (branch: string, noFastForward?: boolean) => Promise<void>;

    // Remote operations
    remotes: RemoteInfo[];
    fetchRemotes: () => Promise<void>;
    addRemote: (name: string, url: string) => Promise<void>;
    removeRemote: (name: string) => Promise<void>;
    fetch: (remote?: string, prune?: boolean) => Promise<void>;
    pull: (remote?: string, branch?: string, rebase?: boolean) => Promise<void>;
    push: (remote?: string, branch?: string, force?: boolean, setUpstream?: boolean) => Promise<void>;
}

export const useGitStore = create<GitState>((set, get) => ({
    status: null,
    commits: [],
    branches: [],
    selectedCommits: [],
    loading: false,
    error: null,
    hasMore: true,
    searchQuery: null,
    currentBranch: null,
    remotes: [],

    fetchStatus: async () => {
        try {
            console.log('[GitStore] fetchStatus: starting...');
            set({ loading: true, error: null });
            const status = await rpcClient.call('git.getStatus');
            console.log('[GitStore] fetchStatus: received status:', status);
            set({ status, loading: false });
            console.log('[GitStore] fetchStatus: state updated');
        } catch (error) {
            console.error('[GitStore] fetchStatus: error:', error);
            set({ error: (error as Error).message, loading: false });
        }
    },

    fetchHistory: async (options = {}) => {
        try {
            console.log('[GitStore] fetchHistory: starting with options:', options);
            set({ loading: true, error: null });
            const commits = await rpcClient.call('git.getCommitLog', options);
            console.log('[GitStore] fetchHistory: received commits:', commits?.length, 'commits');
            set({ commits, loading: false });
            console.log('[GitStore] fetchHistory: state updated');
        } catch (error) {
            console.error('[GitStore] fetchHistory: error:', error);
            set({ error: (error as Error).message, loading: false });
        }
    },

    fetchBranches: async () => {
        try {
            const branches = await rpcClient.call('git.getBranches');
            const currentBranch = branches.find((b: BranchInfo) => b.current)?.name || null;
            set({ branches, currentBranch });
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    stageFiles: async (files) => {
        try {
            await rpcClient.call('git.stageFiles', files);
            await get().fetchStatus();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    unstageFiles: async (files) => {
        try {
            await rpcClient.call('git.unstageFiles', files);
            await get().fetchStatus();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    stageAll: async () => {
        try {
            await rpcClient.call('git.stageAll');
            await get().fetchStatus();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    unstageAll: async () => {
        try {
            await rpcClient.call('git.unstageAll');
            await get().fetchStatus();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    commit: async (message) => {
        try {
            await rpcClient.call('git.commit', message);
            await get().fetchStatus();
            await get().fetchHistory();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    discardFiles: async (files) => {
        try {
            await rpcClient.call('git.discard', files);
            await get().fetchStatus();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    selectCommit: (hash, multi) => {
        const { selectedCommits } = get();
        if (multi) {
            if (selectedCommits.includes(hash)) {
                set({ selectedCommits: selectedCommits.filter((h) => h !== hash) });
            } else {
                set({ selectedCommits: [...selectedCommits, hash] });
            }
        } else {
            set({ selectedCommits: [hash] });
        }
    },

    clearSelection: () => {
        set({ selectedCommits: [] });
    },

    amendCommit: async (message?: string) => {
        try {
            await rpcClient.call('git.amendCommit', message);
            await get().fetchStatus();
            await get().fetchHistory();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    revertCommits: async (commits: string[]) => {
        try {
            await rpcClient.call('git.revert', commits);
            await get().fetchHistory();
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    getFileDiff: async (file: string, staged: boolean = false): Promise<string> => {
        try {
            return await rpcClient.call('git.getFileDiff', file, staged);
        } catch (error) {
            set({ error: (error as Error).message });
            return '';
        }
    },

    searchCommits: async (query: string, type: 'message' | 'author' | 'hash') => {
        try {
            set({ loading: true, error: null, searchQuery: query });

            let commits: CommitNode[];
            if (type === 'author') {
                commits = await rpcClient.call('git.getCommitsByAuthor', query, { maxCount: 100 });
            } else if (type === 'hash') {
                // Search by hash - just filter locally or fetch specific commit
                const allCommits = get().commits;
                commits = allCommits.filter(
                    (c) =>
                        c.hash.toLowerCase().includes(query.toLowerCase()) ||
                        c.shortHash.toLowerCase().includes(query.toLowerCase())
                );
            } else {
                // Search by message
                commits = await rpcClient.call('git.searchCommits', query, { maxCount: 100 });
            }

            set({ commits, loading: false, hasMore: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    clearSearch: async () => {
        set({ searchQuery: null });
        await get().fetchHistory({ maxCount: 100 });
    },

    loadMore: async () => {
        const { commits, loading, hasMore, searchQuery } = get();

        if (loading || !hasMore || searchQuery) {
            return;
        }

        try {
            set({ loading: true });
            const newCommits = await rpcClient.call('git.getCommitLog', {
                maxCount: 50,
                skip: commits.length,
            });

            if (newCommits.length === 0) {
                set({ hasMore: false, loading: false });
            } else {
                set({
                    commits: [...commits, ...newCommits],
                    loading: false,
                    hasMore: newCommits.length === 50,
                });
            }
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    startRebase: async (onto: string, interactive: boolean, commits?: any[]) => {
        try {
            set({ loading: true, error: null });
            if (interactive && commits) {
                await rpcClient.call('git.interactiveRebase', onto, commits);
            } else {
                await rpcClient.call('git.rebase', onto, interactive);
            }
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    continueRebase: async () => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.rebaseContinue');
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    abortRebase: async () => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.rebaseAbort');
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    skipRebase: async () => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.rebaseSkip');
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    getRebaseState: async () => {
        try {
            return await rpcClient.call('git.getRebaseState');
        } catch (error) {
            set({ error: (error as Error).message });
            return { type: 'idle' };
        }
    },

    isRebasing: async () => {
        try {
            return await rpcClient.call('git.isRebasing');
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    cherryPick: async (commits: string[]) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.cherryPick', commits);
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    getStashes: async () => {
        try {
            return await rpcClient.call('git.stashList');
        } catch (error) {
            set({ error: (error as Error).message });
            return [];
        }
    },

    createStash: async (message?: string, includeUntracked: boolean = false) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.stashPush', message, includeUntracked);
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    applyStash: async (index: number) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.stashApply', index);
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    popStash: async (index: number) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.stashPop', index);
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    dropStash: async (index: number) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.stashDrop', index);
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    createBranch: async (name: string, startPoint?: string) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.createBranch', name, startPoint);
            await get().fetchBranches();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    deleteBranch: async (name: string, force: boolean = false) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.deleteBranch', name, force);
            await get().fetchBranches();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    renameBranch: async (oldName: string, newName: string, force: boolean = false) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.renameBranch', oldName, newName, force);
            await get().fetchBranches();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    checkoutBranch: async (name: string, create: boolean = false) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.checkoutBranch', name, create);
            await get().fetchBranches();
            await get().fetchStatus();
            await get().fetchHistory();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    mergeBranch: async (branch: string, noFastForward: boolean = false) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.mergeBranch', branch, noFastForward);
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    // Remote operations
    fetchRemotes: async () => {
        try {
            set({ loading: true, error: null });
            const remotes = await rpcClient.call('git.listRemotes');
            set({ remotes, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    addRemote: async (name: string, url: string) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.addRemote', name, url);
            await get().fetchRemotes();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    removeRemote: async (name: string) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.removeRemote', name);
            await get().fetchRemotes();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    fetch: async (remote?: string, prune?: boolean) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.fetch', remote, prune);
            await get().fetchHistory();
            await get().fetchBranches();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    pull: async (remote?: string, branch?: string, rebase?: boolean) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.pull', remote, branch, rebase);
            await get().fetchHistory();
            await get().fetchStatus();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    push: async (remote?: string, branch?: string, force?: boolean, setUpstream?: boolean) => {
        try {
            set({ loading: true, error: null });
            await rpcClient.call('git.push', remote, branch, force, setUpstream);
            await get().fetchBranches();
            set({ loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },
}));
