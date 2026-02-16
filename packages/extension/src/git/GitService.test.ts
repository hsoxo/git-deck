import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitService } from './GitService';
import type { SimpleGit } from 'simple-git';

// Mock simple-git
vi.mock('simple-git', () => ({
    default: vi.fn(() => ({
        status: vi.fn(),
        log: vi.fn(),
        add: vi.fn(),
        reset: vi.fn(),
        commit: vi.fn(),
        checkout: vi.fn(),
        branch: vi.fn(),
    })),
}));

describe('GitService', () => {
    let gitService: GitService;
    let mockGit: any;

    beforeEach(() => {
        gitService = new GitService('/test/repo');
        mockGit = (gitService as any).git;
    });

    describe('getStatus', () => {
        it('should return git status', async () => {
            mockGit.status.mockResolvedValue({
                staged: ['file1.ts'],
                modified: ['file2.ts'],
                deleted: [],
                not_added: ['file3.ts'],
                current: 'main',
                tracking: 'origin/main',
                files: [
                    { path: 'file1.ts', index: 'M', working_dir: ' ' },
                    { path: 'file2.ts', index: ' ', working_dir: 'M' },
                    { path: 'file3.ts', index: '?', working_dir: '?' },
                ],
            });

            const status = await gitService.getStatus();

            expect(status.staged).toEqual(['file1.ts']);
            expect(status.unstaged).toContain('file2.ts');
            expect(status.untracked).toEqual(['file3.ts']);
            expect(status.current).toBe('main');
        });
    });

    describe('getLog', () => {
        it('should return commit history', async () => {
            mockGit.log.mockResolvedValue({
                all: [
                    {
                        hash: 'abc123',
                        message: 'Test commit',
                        author_name: 'Test User',
                        author_email: 'test@example.com',
                        date: '2024-01-01',
                        parents: [],
                        refs: 'HEAD -> main',
                    },
                ],
                latest: {
                    hash: 'abc123',
                },
            });

            mockGit.branch.mockResolvedValue({
                current: 'main',
            });

            const commits = await gitService.getLog();

            expect(commits).toHaveLength(1);
            expect(commits[0].hash).toBe('abc123');
            expect(commits[0].message).toBe('Test commit');
            expect(commits[0].author).toBe('Test User');
        });
    });

    describe('stageFiles', () => {
        it('should stage files', async () => {
            await gitService.stageFiles(['file1.ts', 'file2.ts']);

            expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts']);
        });
    });

    describe('commit', () => {
        it('should commit with message', async () => {
            await gitService.commit('Test commit message');

            expect(mockGit.commit).toHaveBeenCalledWith('Test commit message');
        });
    });
});
