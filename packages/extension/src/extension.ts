import * as vscode from 'vscode';
import { GitService } from './git/GitService';
import { logger } from './utils/Logger';
import { Config } from './config/Config';
import { ChangesTreeProvider } from './views/ChangesTreeProvider';
import { CommitView } from './views/CommitView';
import { GitGraphPanel } from './webview/GitGraphPanel';

export function activate(context: vscode.ExtensionContext) {
    // 创建 Output Channel - 使用更明确的名称
    const outputChannel = vscode.window.createOutputChannel('Git GUI Extension');
    context.subscriptions.push(outputChannel);

    // 初始化 Logger
    logger.initialize(outputChannel);

    // 立即显示输出通道以便用户看到
    outputChannel.show(true);

    logger.info('Git GUI extension is now active');
    logger.info('Output channel created and visible');

    // Set debug mode based on configuration
    const logLevel = Config.getLogLevel();
    logger.setDebugMode(logLevel === 'debug');

    // 初始化 Git 服务和 Changes Tree Provider
    let gitService: GitService | undefined;
    let changesTreeProvider: ChangesTreeProvider | undefined;
    let commitView: CommitView | undefined;

    // 创建防抖刷新函数
    let refreshTimer: NodeJS.Timeout | undefined;
    const DEBOUNCE_DELAY = Config.getFileWatcherDebounceDelay();

    const debouncedRefreshAllViews = () => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }
        refreshTimer = setTimeout(() => {
            changesTreeProvider?.refresh();
            commitView?.refresh();
            refreshTimer = undefined;
        }, DEBOUNCE_DELAY);
    };

    // 立即刷新（用于用户主动触发的操作）
    const immediateRefreshAllViews = () => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = undefined;
        }
        changesTreeProvider?.refresh();
        commitView?.refresh();
    };

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        try {
            gitService = new GitService(workspaceFolder.uri.fsPath);

            changesTreeProvider = new ChangesTreeProvider(gitService);
            context.subscriptions.push(
                vscode.window.registerTreeDataProvider('gitGui.changes', changesTreeProvider)
            );

            // Register commit view
            commitView = new CommitView(context.extensionUri, gitService, immediateRefreshAllViews);
            context.subscriptions.push(
                vscode.window.registerWebviewViewProvider(
                    CommitView.viewType,
                    commitView
                )
            );

            // 监听文件变化 - 使用防抖优化性能
            const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

            // 过滤不需要监听的文件
            const ignorePatterns = Config.getFileWatcherIgnorePatterns();
            const shouldIgnoreFile = (uri: vscode.Uri): boolean => {
                const path = uri.fsPath;
                // 检查路径是否包含任何忽略模式
                return ignorePatterns.some(pattern =>
                    path.includes(`/${pattern}/`) ||
                    path.includes(`\\${pattern}\\`) ||
                    path.endsWith(`/${pattern}`) ||
                    path.endsWith(`\\${pattern}`)
                );
            };

            fileWatcher.onDidChange((uri) => {
                if (!shouldIgnoreFile(uri)) {
                    debouncedRefreshAllViews();
                }
            });

            fileWatcher.onDidCreate((uri) => {
                if (!shouldIgnoreFile(uri)) {
                    debouncedRefreshAllViews();
                }
            });

            fileWatcher.onDidDelete((uri) => {
                if (!shouldIgnoreFile(uri)) {
                    debouncedRefreshAllViews();
                }
            });

            context.subscriptions.push(fileWatcher);
            context.subscriptions.push({
                dispose: () => {
                    if (refreshTimer) {
                        clearTimeout(refreshTimer);
                    }
                }
            });

            logger.info('Changes tree view and commit view registered with debounced file watcher');
        } catch (error) {
            logger.error('Failed to initialize Git service', error);
        }
    }

    // 注册命令（总是注册，在命令执行时检查工作区）
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.refresh', () => {
            logger.debug('Refresh command triggered');
            immediateRefreshAllViews();
        })
    );

    // 添加命令：显示输出面板
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.showOutput', () => {
            logger.show();
        })
    );

    // Stage/Unstage 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.stageFile', async (item: any) => {
            if (gitService && item.filePath) {
                try {
                    await gitService.stageFiles([item.filePath]);
                    immediateRefreshAllViews();
                } catch (error) {
                    logger.error('Failed to stage file', error);
                    vscode.window.showErrorMessage(`Failed to stage file: ${error}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.unstageFile', async (item: any) => {
            if (gitService && item.filePath) {
                try {
                    await gitService.unstageFiles([item.filePath]);
                    immediateRefreshAllViews();
                } catch (error) {
                    logger.error('Failed to unstage file', error);
                    vscode.window.showErrorMessage(`Failed to unstage file: ${error}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.stageAll', async () => {
            if (gitService) {
                try {
                    const status = await gitService.getStatus();
                    const allFiles = [...status.unstaged, ...status.untracked];
                    if (allFiles.length > 0) {
                        await gitService.stageFiles(allFiles);
                        immediateRefreshAllViews();
                    }
                } catch (error) {
                    logger.error('Failed to stage all', error);
                    vscode.window.showErrorMessage(`Failed to stage all: ${error}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.unstageAll', async () => {
            if (gitService) {
                try {
                    const status = await gitService.getStatus();
                    if (status.staged.length > 0) {
                        await gitService.unstageFiles(status.staged);
                        immediateRefreshAllViews();
                    }
                } catch (error) {
                    logger.error('Failed to unstage all', error);
                    vscode.window.showErrorMessage(`Failed to unstage all: ${error}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.openDiff', async (filePath: string, staged: boolean) => {
            if (!workspaceFolder) {
                return;
            }

            try {
                const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);

                if (staged) {
                    // 对于 staged 文件，显示 Index vs HEAD 的 diff
                    // 使用 git.openChange 会显示 working tree vs index
                    // 我们需要使用 vscode.diff 来显示 HEAD vs Index
                    const headUri = fileUri.with({
                        scheme: 'git',
                        path: fileUri.fsPath,
                        query: JSON.stringify({
                            path: fileUri.fsPath,
                            ref: 'HEAD'
                        })
                    });

                    const indexUri = fileUri.with({
                        scheme: 'git',
                        path: fileUri.fsPath,
                        query: JSON.stringify({
                            path: fileUri.fsPath,
                            ref: '~'  // ~ 表示 index/staged
                        })
                    });

                    await vscode.commands.executeCommand(
                        'vscode.diff',
                        headUri,
                        indexUri,
                        `${filePath} (Staged Changes)`,
                        { preview: true }
                    );
                } else {
                    // 对于 unstaged 文件，使用 git.openChange 显示 working tree vs index
                    await vscode.commands.executeCommand('git.openChange', fileUri);
                }
            } catch (error) {
                logger.error('Failed to open diff', error);
                vscode.window.showErrorMessage(`Failed to open diff: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.discardChanges', async (item: any) => {
            if (gitService && item.filePath) {
                const answer = await vscode.window.showWarningMessage(
                    `Are you sure you want to discard changes in ${item.filePath}?`,
                    { modal: true },
                    'Discard'
                );

                if (answer === 'Discard') {
                    try {
                        await gitService.discardChanges([item.filePath]);
                        immediateRefreshAllViews();
                    } catch (error) {
                        logger.error('Failed to discard changes', error);
                        vscode.window.showErrorMessage(`Failed to discard changes: ${error}`);
                    }
                }
            }
        })
    );

    // Commit 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.commit', async () => {
            if (!gitService) {
                return;
            }

            try {
                const status = await gitService.getStatus();
                if (status.staged.length === 0) {
                    vscode.window.showWarningMessage('No staged changes to commit');
                    return;
                }

                const message = await vscode.window.showInputBox({
                    prompt: 'Commit message',
                    placeHolder: 'Enter commit message...',
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'Commit message cannot be empty';
                        }
                        return null;
                    }
                });

                if (message) {
                    await gitService.commit(message);
                    immediateRefreshAllViews();
                    vscode.window.showInformationMessage(`Committed: ${message}`);
                }
            } catch (error) {
                logger.error('Failed to commit', error);
                vscode.window.showErrorMessage(`Failed to commit: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.commitAmend', async () => {
            if (!gitService) {
                return;
            }

            try {
                const commits = await gitService.getLog({ maxCount: 1 });
                if (commits.length === 0) {
                    vscode.window.showWarningMessage('No commits to amend');
                    return;
                }

                const lastCommitMessage = commits[0].message;
                const message = await vscode.window.showInputBox({
                    prompt: 'Amend commit message',
                    value: lastCommitMessage,
                    validateInput: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'Commit message cannot be empty';
                        }
                        return null;
                    }
                });

                if (message) {
                    await gitService.amendCommit(message);
                    immediateRefreshAllViews();
                    vscode.window.showInformationMessage(`Amended commit: ${message}`);
                }
            } catch (error) {
                logger.error('Failed to amend commit', error);
                vscode.window.showErrorMessage(`Failed to amend commit: ${error}`);
            }
        })
    );

    // Git Graph 命令
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.openGraph', () => {
            logger.debug('Open Graph command triggered');

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Git GUI: No workspace folder found. Please open a folder first.');
                logger.warn('No workspace folder found');
                return;
            }

            try {
                if (!gitService) {
                    gitService = new GitService(workspaceFolder.uri.fsPath);
                }
                GitGraphPanel.createOrShow(context.extensionUri, gitService);
            } catch (error) {
                logger.error('Failed to open Git Graph', error);
                vscode.window.showErrorMessage(`Git GUI: Failed to open Git Graph - ${error}`);
            }
        })
    );

    logger.info('Git GUI extension activated successfully');

    // 显示激活通知
    vscode.window.showInformationMessage('Git GUI Extension activated! Check Output panel for logs.');
}

export function deactivate() {
    logger.info('Git GUI extension deactivated');
}
