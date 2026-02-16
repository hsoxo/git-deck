import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommitView } from './CommitView';
import { GitService } from '../git/GitService';
import * as vscode from 'vscode';
import type { GitStatus } from '@git-gui/shared';

// Mock vscode
vi.mock('vscode', () => ({
    Uri: {
        parse: vi.fn((str) => ({ toString: () => str })),
    },
    window: {
        showWarningMessage: vi.fn(),
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
    },
    WebviewView: vi.fn(),
}));

// Mock GitService
vi.mock('../git/GitService');

// Mock logger
vi.mock('../utils/Logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('CommitView', () => {
    let commitView: CommitView;
    let mockGitService: GitService;
    let mockRefresh: ReturnType<typeof vi.fn>;
    let mockWebviewView: any;
    let mockWebview: any;

    beforeEach(() => {
        mockRefresh = vi.fn();
        mockGitService = {
            getStatus: vi.fn(),
            getLog: vi.fn(),
            getCurrentBranch: vi.fn(),
            commit: vi.fn(),
            amendCommit: vi.fn(),
            push: vi.fn(),
        } as any;

        mockWebview = {
            options: {},
            html: '',
            postMessage: vi.fn(),
            onDidReceiveMessage: vi.fn((callback) => {
                mockWebview._messageCallback = callback;
                return { dispose: vi.fn() };
            }),
        };

        mockWebviewView = {
            webview: mockWebview,
            visible: true,
            onDidChangeVisibility: vi.fn((callback) => {
                return { dispose: vi.fn() };
            }),
        };

        const mockExtensionUri = { toString: () => 'file:///extension' } as any;
        commitView = new CommitView(mockExtensionUri, mockGitService, mockRefresh);
    });

    describe('resolveWebviewView', () => {
        it('should set webview options', () => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);

            expect(mockWebview.options).toHaveProperty('enableScripts', true);
            expect(mockWebview.options).toHaveProperty('localResourceRoots');
        });

        it('should set HTML content', () => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);

            expect(mockWebview.html).toContain('Commit message');
            expect(mockWebview.html).toContain('commitMessage');
        });

        it('should register message handler', () => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);

            expect(mockWebview.onDidReceiveMessage).toHaveBeenCalled();
        });
    });

    describe('message handling - commit', () => {
        beforeEach(() => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        });

        it('should handle commit message', async () => {
            const mockStatus: GitStatus = {
                staged: ['file.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);
            vi.mocked(mockGitService.commit).mockResolvedValue();

            await mockWebview._messageCallback({ type: 'commit', message: 'Test commit' });

            expect(mockGitService.commit).toHaveBeenCalledWith('Test commit');
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Committed: Test commit'
            );
        });

        it('should reject empty commit message', async () => {
            await mockWebview._messageCallback({ type: 'commit', message: '' });

            expect(mockGitService.commit).not.toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Commit message cannot be empty'
            );
        });

        it('should reject whitespace-only commit message', async () => {
            await mockWebview._messageCallback({ type: 'commit', message: '   ' });

            expect(mockGitService.commit).not.toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Commit message cannot be empty'
            );
        });

        it('should reject commit when no staged changes', async () => {
            const mockStatus: GitStatus = {
                staged: [],
                unstaged: ['file.ts'],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);

            await mockWebview._messageCallback({ type: 'commit', message: 'Test' });

            expect(mockGitService.commit).not.toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'No staged changes to commit'
            );
        });

        it('should handle commit errors', async () => {
            const mockStatus: GitStatus = {
                staged: ['file.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);
            vi.mocked(mockGitService.commit).mockRejectedValue(new Error('Commit failed'));

            await mockWebview._messageCallback({ type: 'commit', message: 'Test' });

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to commit')
            );
        });
    });

    describe('message handling - amend commit', () => {
        beforeEach(() => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        });

        it('should handle amend commit', async () => {
            vi.mocked(mockGitService.amendCommit).mockResolvedValue();

            await mockWebview._messageCallback({ type: 'commitAmend', message: 'Amended' });

            expect(mockGitService.amendCommit).toHaveBeenCalledWith('Amended');
            expect(mockRefresh).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Amended commit: Amended'
            );
        });

        it('should reject empty amend message', async () => {
            await mockWebview._messageCallback({ type: 'commitAmend', message: '' });

            expect(mockGitService.amendCommit).not.toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Commit message cannot be empty'
            );
        });
    });

    describe('message handling - push', () => {
        beforeEach(() => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        });

        it('should handle push', async () => {
            vi.mocked(mockGitService.push).mockResolvedValue();

            await mockWebview._messageCallback({ type: 'push' });

            expect(mockGitService.push).toHaveBeenCalledWith(false);
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Pushed successfully'
            );
        });

        it('should handle push errors', async () => {
            vi.mocked(mockGitService.push).mockRejectedValue(new Error('Push failed'));

            await mockWebview._messageCallback({ type: 'push' });

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to push')
            );
        });
    });

    describe('message handling - force push', () => {
        beforeEach(() => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        });

        it('should handle force push with confirmation', async () => {
            vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Force Push' as any);
            vi.mocked(mockGitService.push).mockResolvedValue();

            await mockWebview._messageCallback({ type: 'pushForce' });

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('force push'),
                expect.anything(),
                'Force Push'
            );
            expect(mockGitService.push).toHaveBeenCalledWith(true);
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Force pushed successfully'
            );
        });

        it('should cancel force push when not confirmed', async () => {
            vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);

            await mockWebview._messageCallback({ type: 'pushForce' });

            expect(mockGitService.push).not.toHaveBeenCalled();
        });
    });

    describe('updateView', () => {
        beforeEach(() => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        });

        it('should send update message with status data', async () => {
            const mockStatus: GitStatus = {
                staged: ['file1.ts', 'file2.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);
            vi.mocked(mockGitService.getLog).mockResolvedValue([
                { message: 'Last commit', hash: 'abc123' } as any,
            ]);
            vi.mocked(mockGitService.getCurrentBranch).mockResolvedValue('main');

            await mockWebview._messageCallback({ type: 'ready' });

            expect(mockWebview.postMessage).toHaveBeenCalledWith({
                type: 'update',
                data: expect.objectContaining({
                    stagedCount: 2,
                    lastCommitMessage: 'Last commit',
                    branch: 'main',
                }),
            });
        });

        it('should handle errors gracefully', async () => {
            vi.mocked(mockGitService.getStatus).mockRejectedValue(new Error('Failed'));

            await mockWebview._messageCallback({ type: 'ready' });

            // Should not throw, error should be logged
            expect(mockWebview.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('refresh', () => {
        it('should update view when called', async () => {
            commitView.resolveWebviewView(mockWebviewView, {} as any, {} as any);

            const mockStatus: GitStatus = {
                staged: ['file.ts'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: 'origin/main',
            };
            vi.mocked(mockGitService.getStatus).mockResolvedValue(mockStatus);
            vi.mocked(mockGitService.getLog).mockResolvedValue([]);
            vi.mocked(mockGitService.getCurrentBranch).mockResolvedValue('main');

            await commitView.refresh();

            expect(mockWebview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'update' })
            );
        });

        it('should do nothing if view not resolved', async () => {
            await commitView.refresh();

            // Should not throw
            expect(mockWebview.postMessage).not.toHaveBeenCalled();
        });
    });
});
