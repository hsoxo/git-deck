import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StageOperations } from './StageOperations';
import type { SimpleGit } from 'simple-git';

describe('StageOperations', () => {
    let stageOps: StageOperations;
    let mockGit: SimpleGit;

    beforeEach(() => {
        mockGit = {
            status: vi.fn(),
            add: vi.fn(),
            reset: vi.fn(),
            commit: vi.fn(),
            checkout: vi.fn(),
        } as any;

        stageOps = new StageOperations(mockGit);
    });

    describe('stage', () => {
        it('should stage files', async () => {
            await stageOps.stage(['file1.ts', 'file2.ts']);

            expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts']);
        });
    });

    describe('unstage', () => {
        it('should unstage files', async () => {
            await stageOps.unstage(['file1.ts']);

            expect(mockGit.reset).toHaveBeenCalledWith(['HEAD', '--', 'file1.ts']);
        });
    });

    describe('stageAll', () => {
        it('should stage all files', async () => {
            await stageOps.stageAll();

            expect(mockGit.add).toHaveBeenCalledWith('.');
        });
    });

    describe('commit', () => {
        it('should commit with message', async () => {
            await stageOps.commit('Test commit');

            expect(mockGit.commit).toHaveBeenCalledWith('Test commit');
        });
    });
});
