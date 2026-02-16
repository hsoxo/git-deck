import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BranchOperations } from './BranchOperations';
import type { SimpleGit } from 'simple-git';

describe('BranchOperations', () => {
    let branchOps: BranchOperations;
    let mockGit: SimpleGit;

    beforeEach(() => {
        mockGit = {
            branch: vi.fn(),
            checkout: vi.fn(),
            checkoutBranch: vi.fn(),
            merge: vi.fn(),
        } as unknown as SimpleGit;

        branchOps = new BranchOperations(mockGit);
    });

    describe('listBranches', () => {
        it('should list local and remote branches', async () => {
            const mockBranchSummary = {
                all: ['main', 'feature', 'remotes/origin/main'],
                branches: {
                    main: {
                        name: 'main',
                        current: true,
                        commit: 'abc123',
                        label: 'main abc123 Initial commit',
                    },
                    feature: {
                        name: 'feature',
                        current: false,
                        commit: 'def456',
                        label: 'feature def456 [origin/feature: ahead 2] Add feature',
                    },
                    'remotes/origin/main': {
                        name: 'origin/main',
                        current: false,
                        commit: 'abc123',
                        label: 'origin/main abc123 Initial commit',
                    },
                },
                current: 'main',
                detached: false,
            };

            vi.mocked(mockGit.branch).mockResolvedValue(mockBranchSummary as any);

            const result = await branchOps.listBranches();

            expect(result.current).toBe('main');
            expect(result.local).toHaveLength(2);
            expect(result.remote).toHaveLength(1);
            expect(result.local[0].name).toBe('main');
            expect(result.local[0].current).toBe(true);
            expect(result.local[1].upstream).toBe('origin/feature');
            expect(result.local[1].ahead).toBe(2);
        });

        it('should handle branches with no tracking info', async () => {
            const mockBranchSummary = {
                all: ['main'],
                branches: {
                    main: {
                        name: 'main',
                        current: true,
                        commit: 'abc123',
                        label: 'main abc123 Initial commit',
                    },
                },
                current: 'main',
                detached: false,
            };

            vi.mocked(mockGit.branch).mockResolvedValue(mockBranchSummary as any);

            const result = await branchOps.listBranches();

            expect(result.local[0].upstream).toBeUndefined();
            expect(result.local[0].ahead).toBeUndefined();
            expect(result.local[0].behind).toBeUndefined();
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Git error'));

            await expect(branchOps.listBranches()).rejects.toThrow('List branches failed');
        });
    });

    describe('createBranch', () => {
        it('should create a new branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.createBranch('new-feature');

            expect(mockGit.branch).toHaveBeenCalledWith(['new-feature']);
        });

        it('should create a branch from a start point', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.createBranch('new-feature', 'main');

            expect(mockGit.branch).toHaveBeenCalledWith(['new-feature', 'main']);
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Branch exists'));

            await expect(branchOps.createBranch('existing')).rejects.toThrow(
                "Create branch 'existing' failed"
            );
        });
    });

    describe('deleteBranch', () => {
        it('should delete a branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.deleteBranch('old-feature');

            expect(mockGit.branch).toHaveBeenCalledWith(['-d', 'old-feature']);
        });

        it('should force delete a branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.deleteBranch('old-feature', true);

            expect(mockGit.branch).toHaveBeenCalledWith(['-D', 'old-feature']);
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Branch not found'));

            await expect(branchOps.deleteBranch('nonexistent')).rejects.toThrow(
                "Delete branch 'nonexistent' failed"
            );
        });
    });

    describe('renameBranch', () => {
        it('should rename a branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.renameBranch('old-name', 'new-name');

            expect(mockGit.branch).toHaveBeenCalledWith(['-m', 'old-name', 'new-name']);
        });

        it('should force rename a branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.renameBranch('old-name', 'new-name', true);

            expect(mockGit.branch).toHaveBeenCalledWith(['-M', 'old-name', 'new-name']);
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Branch not found'));

            await expect(branchOps.renameBranch('old', 'new')).rejects.toThrow(
                "Rename branch 'old' to 'new' failed"
            );
        });
    });

    describe('checkoutBranch', () => {
        it('should checkout an existing branch', async () => {
            vi.mocked(mockGit.checkout).mockResolvedValue('Switched to branch' as any);

            await branchOps.checkoutBranch('feature');

            expect(mockGit.checkout).toHaveBeenCalledWith('feature');
        });

        it('should create and checkout a new branch', async () => {
            vi.mocked(mockGit.checkoutBranch).mockResolvedValue({} as any);

            await branchOps.checkoutBranch('new-feature', true);

            expect(mockGit.checkoutBranch).toHaveBeenCalledWith('new-feature', 'HEAD');
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.checkout).mockRejectedValue(new Error('Branch not found'));

            await expect(branchOps.checkoutBranch('nonexistent')).rejects.toThrow(
                "Checkout branch 'nonexistent' failed"
            );
        });
    });

    describe('setUpstream', () => {
        it('should set upstream tracking branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.setUpstream('feature', 'origin/feature');

            expect(mockGit.branch).toHaveBeenCalledWith([
                '--set-upstream-to',
                'origin/feature',
                'feature',
            ]);
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Remote not found'));

            await expect(branchOps.setUpstream('feature', 'origin/feature')).rejects.toThrow(
                "Set upstream for branch 'feature' failed"
            );
        });
    });

    describe('unsetUpstream', () => {
        it('should unset upstream tracking branch', async () => {
            vi.mocked(mockGit.branch).mockResolvedValue({} as any);

            await branchOps.unsetUpstream('feature');

            expect(mockGit.branch).toHaveBeenCalledWith(['--unset-upstream', 'feature']);
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Branch not found'));

            await expect(branchOps.unsetUpstream('nonexistent')).rejects.toThrow(
                "Unset upstream for branch 'nonexistent' failed"
            );
        });
    });

    describe('mergeBranch', () => {
        it('should merge a branch', async () => {
            vi.mocked(mockGit.merge).mockResolvedValue({} as any);

            await branchOps.mergeBranch('feature');

            expect(mockGit.merge).toHaveBeenCalledWith(['feature']);
        });

        it('should merge with no-fast-forward', async () => {
            vi.mocked(mockGit.merge).mockResolvedValue({} as any);

            await branchOps.mergeBranch('feature', true);

            expect(mockGit.merge).toHaveBeenCalledWith(['--no-ff', 'feature']);
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.merge).mockRejectedValue(new Error('Merge conflict'));

            await expect(branchOps.mergeBranch('feature')).rejects.toThrow(
                "Merge branch 'feature' failed"
            );
        });
    });

    describe('getCurrentBranch', () => {
        it('should get current branch name', async () => {
            const mockBranchSummary = {
                all: ['main', 'feature'],
                branches: {},
                current: 'main',
                detached: false,
            };

            vi.mocked(mockGit.branch).mockResolvedValue(mockBranchSummary as any);

            const result = await branchOps.getCurrentBranch();

            expect(result).toBe('main');
        });

        it('should throw error on failure', async () => {
            vi.mocked(mockGit.branch).mockRejectedValue(new Error('Git error'));

            await expect(branchOps.getCurrentBranch()).rejects.toThrow('Get current branch failed');
        });
    });
});
