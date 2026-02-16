import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangesTreeProvider } from './ChangesTreeProvider';
import { GitService } from '../git/GitService';
import type { GitStatus } from '@git-gui/shared';

// Mock GitService
vi.mock('../git/GitService');

describe('ChangesTreeProvider', () => {
    let provider: ChangesTreeProvider;
    let mockGitService: GitService;

    beforeEach(() => {
        mockGitService = {
            getStatus: vi.fn(),
        } as any;
        provider = new ChangesTreeProvider(mockGitService);
    });

    describe('getChildren - root level', () => {
        it('should return Unstaged and Staged sections', async () => {
            const mockStatus: GitStatus = {
                staged: ['file1.ts'],
                unstaged: ['file2.ts'],
                untracked: ['file3.ts'],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const children = await provider.getChildren();

            expect(children).toHaveLength(2);
            expect(children[0]).toMatchObject({
                label: 'Unstaged Changes',
                contextValue: 'unstaged',
            });
            expect(children[1]).toMatchObject({
                label: 'Staged Changes',
                contextValue: 'staged',
            });
        });

        it('should show correct counts', async () => {
            const mockStatus: GitStatus = {
                staged: ['file1.ts', 'file2.ts'],
                unstaged: ['file3.ts'],
                untracked: ['file4.ts', 'file5.ts'],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const children = await provider.getChildren();

            // Unstaged count = unstaged + untracked
            expect(children[0].description).toBe('3');
            // Staged count
            expect(children[1].description).toBe('2');
        });
    });

    describe('getChildren - file tree', () => {
        it('should build flat file list for root files', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['file1.ts', 'file2.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const unstagedSection = sections[0];
            const files = await provider.getChildren(unstagedSection);

            expect(files).toHaveLength(2);
            expect(files[0]).toMatchObject({
                label: 'file1.ts',
                contextValue: 'unstagedFile',
            });
            expect(files[1]).toMatchObject({
                label: 'file2.ts',
                contextValue: 'unstagedFile',
            });
        });

        it('should build tree structure for nested files', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['src/file1.ts', 'src/utils/file2.ts', 'README.md'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const unstagedSection = sections[0];
            const items = await provider.getChildren(unstagedSection);

            // Should have: README.md (file) and src (folder)
            expect(items).toHaveLength(2);

            // First should be folder (folders come first)
            expect(items[0]).toMatchObject({
                label: 'src',
                contextValue: 'folder',
            });

            // Second should be file
            expect(items[1]).toMatchObject({
                label: 'README.md',
                contextValue: 'unstagedFile',
            });
        });

        it('should sort folders before files', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['file.ts', 'src/nested.ts', 'another.ts', 'lib/util.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const unstagedSection = sections[0];
            const items = await provider.getChildren(unstagedSection);

            // Folders: lib, src
            // Files: another.ts, file.ts
            expect(items[0].label).toBe('lib');
            expect(items[1].label).toBe('src');
            expect(items[2].label).toBe('another.ts');
            expect(items[3].label).toBe('file.ts');
        });

        it('should handle deeply nested folders', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['src/components/Button/Button.tsx'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const unstagedSection = sections[0];
            const level1 = await provider.getChildren(unstagedSection);

            // Level 1: src folder
            expect(level1).toHaveLength(1);
            expect(level1[0].label).toBe('src');

            // Level 2: components folder
            const level2 = await provider.getChildren(level1[0]);
            expect(level2).toHaveLength(1);
            expect(level2[0].label).toBe('components');

            // Level 3: Button folder
            const level3 = await provider.getChildren(level2[0]);
            expect(level3).toHaveLength(1);
            expect(level3[0].label).toBe('Button');

            // Level 4: Button.tsx file
            const level4 = await provider.getChildren(level3[0]);
            expect(level4).toHaveLength(1);
            expect(level4[0].label).toBe('Button.tsx');
        });
    });

    describe('getChildren - staged vs unstaged', () => {
        it('should mark staged files correctly', async () => {
            const mockStatus: GitStatus = {
                staged: ['file1.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const stagedSection = sections[1];
            const files = await provider.getChildren(stagedSection);

            expect(files[0]).toMatchObject({
                label: 'file1.ts',
                contextValue: 'stagedFile',
            });
        });

        it('should mark unstaged files correctly', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['file1.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const unstagedSection = sections[0];
            const files = await provider.getChildren(unstagedSection);

            expect(files[0]).toMatchObject({
                label: 'file1.ts',
                contextValue: 'unstagedFile',
            });
        });

        it('should include untracked files in unstaged', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['modified.ts'],
                untracked: ['new.ts'],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const unstagedSection = sections[0];
            const files = await provider.getChildren(unstagedSection);

            expect(files).toHaveLength(2);
            expect(files.map(f => f.label).sort()).toEqual(['modified.ts', 'new.ts']);
        });
    });

    describe('getChildren - partial staging', () => {
        it('should show file in both sections when partially staged', async () => {
            const mockStatus: GitStatus = {
                staged: ['file.ts'],
                unstaged: ['file.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();

            // Check unstaged section
            const unstagedFiles = await provider.getChildren(sections[0]);
            expect(unstagedFiles).toHaveLength(1);
            expect(unstagedFiles[0].label).toBe('file.ts');
            expect(unstagedFiles[0].contextValue).toBe('unstagedFile');

            // Check staged section
            const stagedFiles = await provider.getChildren(sections[1]);
            expect(stagedFiles).toHaveLength(1);
            expect(stagedFiles[0].label).toBe('file.ts');
            expect(stagedFiles[0].contextValue).toBe('stagedFile');
        });
    });

    describe('refresh', () => {
        it('should fire onDidChangeTreeData event', () => {
            const listener = vi.fn();
            provider.onDidChangeTreeData(listener);

            provider.refresh();

            expect(listener).toHaveBeenCalled();
        });
    });

    describe('getTreeItem', () => {
        it('should return the element as-is', async () => {
            const mockStatus: GitStatus = {
                staged: ['file.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const item = provider.getTreeItem(sections[0]);

            expect(item).toBe(sections[0]);
        });
    });

    describe('file commands', () => {
        it('should set correct command for unstaged files', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['file.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const files = await provider.getChildren(sections[0]);

            expect(files[0].command).toMatchObject({
                command: 'gitGui.openDiff',
                title: 'Open Diff',
                arguments: ['file.ts', false],
            });
        });

        it('should set correct command for staged files', async () => {
            const mockStatus: GitStatus = {
                staged: ['file.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            const sections = await provider.getChildren();
            const files = await provider.getChildren(sections[1]);

            expect(files[0].command).toMatchObject({
                command: 'gitGui.openDiff',
                title: 'Open Diff',
                arguments: ['file.ts', true],
            });
        });
    });
});
