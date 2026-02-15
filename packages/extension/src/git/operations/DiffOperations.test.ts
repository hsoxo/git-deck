import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiffOperations } from './DiffOperations';
import type { SimpleGit } from 'simple-git';

describe('DiffOperations', () => {
    let diffOps: DiffOperations;
    let mockGit: SimpleGit;

    beforeEach(() => {
        mockGit = {
            diff: vi.fn(),
            show: vi.fn(),
        } as any;

        diffOps = new DiffOperations(mockGit);
    });

    describe('getFileDiff', () => {
        it('should get unstaged file diff', async () => {
            vi.mocked(mockGit.diff).mockResolvedValue('diff content');

            const diff = await diffOps.getFileDiff('file.ts', false);

            expect(mockGit.diff).toHaveBeenCalledWith(['file.ts']);
            expect(diff).toBe('diff content');
        });

        it('should get staged file diff', async () => {
            vi.mocked(mockGit.diff).mockResolvedValue('diff content');

            const diff = await diffOps.getFileDiff('file.ts', true);

            expect(mockGit.diff).toHaveBeenCalledWith(['--cached', 'file.ts']);
            expect(diff).toBe('diff content');
        });
    });

    describe('getDiffStats', () => {
        it('should parse diff statistics', async () => {
            const mockStats = '10\t5\tfile1.ts\n20\t10\tfile2.ts';
            vi.mocked(mockGit.diff).mockResolvedValue(mockStats);

            const stats = await diffOps.getDiffStats();

            expect(stats).toHaveLength(2);
            expect(stats[0]).toEqual({
                file: 'file1.ts',
                additions: 10,
                deletions: 5,
                changes: 15,
                diff: '',
            });
            expect(stats[1]).toEqual({
                file: 'file2.ts',
                additions: 20,
                deletions: 10,
                changes: 30,
                diff: '',
            });
        });
    });

    describe('getCommitChanges', () => {
        it('should get commit diff', async () => {
            vi.mocked(mockGit.show).mockResolvedValue('commit diff');

            const diff = await diffOps.getCommitChanges('abc123');

            expect(mockGit.show).toHaveBeenCalledWith(['abc123']);
            expect(diff).toBe('commit diff');
        });
    });
});
