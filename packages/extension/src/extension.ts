import * as vscode from 'vscode';
import { GitService } from './git/GitService';
import { logger } from './utils/Logger';
import { Config } from './config/Config';
import { GitGuiPanel } from './webview/GitGuiPanel';
import { GitGuiWelcomeView } from './webview/GitGuiWelcomeView';
import { ChangesTreeProvider } from './views/ChangesTreeProvider';

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

    // 注册欢迎视图（总是注册，即使没有工作区）
    const welcomeViewProvider = new GitGuiWelcomeView(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            GitGuiWelcomeView.viewType,
            welcomeViewProvider
        )
    );

    // 初始化 Git 服务和 Changes Tree Provider
    let gitService: GitService | undefined;
    let changesTreeProvider: ChangesTreeProvider | undefined;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        try {
            gitService = new GitService(workspaceFolder.uri.fsPath);
            changesTreeProvider = new ChangesTreeProvider(gitService);

            context.subscriptions.push(
                vscode.window.registerTreeDataProvider('gitGui.changes', changesTreeProvider)
            );

            // 监听文件变化
            const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

            const refreshChanges = () => {
                changesTreeProvider?.refresh();
                GitGuiPanel.refresh();
            };

            fileWatcher.onDidChange(refreshChanges);
            fileWatcher.onDidCreate(refreshChanges);
            fileWatcher.onDidDelete(refreshChanges);

            context.subscriptions.push(fileWatcher);

            logger.info('Changes tree view registered with file watcher');
        } catch (error) {
            logger.error('Failed to initialize Git service', error);
        }
    }

    // 注册命令（总是注册，在命令执行时检查工作区）
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.open', () => {
            logger.debug('Open command triggered');

            // 检查工作区
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('Git GUI: No workspace folder found. Please open a folder first.');
                logger.warn('No workspace folder found');
                return;
            }

            try {
                // 初始化 Git 服务
                if (!gitService) {
                    gitService = new GitService(workspaceFolder.uri.fsPath);
                }
                GitGuiPanel.createOrShow(context.extensionUri, gitService);
            } catch (error) {
                logger.error('Failed to open Git GUI', error);
                vscode.window.showErrorMessage(`Git GUI: Failed to open - ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.refresh', () => {
            logger.debug('Refresh command triggered');
            GitGuiPanel.refresh();
            changesTreeProvider?.refresh();
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
                    changesTreeProvider?.refresh();
                    GitGuiPanel.refresh();
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
                    changesTreeProvider?.refresh();
                    GitGuiPanel.refresh();
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
                        changesTreeProvider?.refresh();
                        GitGuiPanel.refresh();
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
                        changesTreeProvider?.refresh();
                        GitGuiPanel.refresh();
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
                const fileUri = vscode.Uri.file(vscode.Uri.joinPath(workspaceFolder.uri, filePath).fsPath);

                // 使用 VS Code 原生的 Git diff
                // 对于 unstaged 文件：比较工作区和 HEAD
                // 对于 staged 文件：比较 index 和 HEAD
                if (staged) {
                    // Staged: 比较 index (HEAD) 和 staged version
                    const headUri = fileUri.with({ scheme: 'git', query: 'HEAD' });
                    const indexUri = fileUri.with({ scheme: 'git', query: '' });
                    await vscode.commands.executeCommand(
                        'vscode.diff',
                        headUri,
                        indexUri,
                        `${filePath} (Index ↔ HEAD)`,
                        { preview: true }
                    );
                } else {
                    // Unstaged: 比较工作区和 index
                    const indexUri = fileUri.with({ scheme: 'git', query: '' });
                    await vscode.commands.executeCommand(
                        'vscode.diff',
                        indexUri,
                        fileUri,
                        `${filePath} (Working Tree ↔ Index)`,
                        { preview: true }
                    );
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
                        changesTreeProvider?.refresh();
                        GitGuiPanel.refresh();
                    } catch (error) {
                        logger.error('Failed to discard changes', error);
                        vscode.window.showErrorMessage(`Failed to discard changes: ${error}`);
                    }
                }
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
