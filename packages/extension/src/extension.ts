import * as vscode from 'vscode';
import { GitService } from './git/GitService';
import { logger } from './utils/Logger';
import { Config } from './config/Config';
import { GitGuiPanel } from './webview/GitGuiPanel';
import { GitGuiWelcomeView } from './webview/GitGuiWelcomeView';

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
                const gitService = new GitService(workspaceFolder.uri.fsPath);
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
        })
    );

    // 添加命令：显示输出面板
    context.subscriptions.push(
        vscode.commands.registerCommand('gitGui.showOutput', () => {
            logger.show();
        })
    );

    logger.info('Git GUI extension activated successfully');

    // 显示激活通知
    vscode.window.showInformationMessage('Git GUI Extension activated! Check Output panel for logs.');
}

export function deactivate() {
    logger.info('Git GUI extension deactivated');
}
