import * as vscode from 'vscode';
import { GitService } from './git/GitService';
import { logger } from './utils/Logger';
import { Config } from './config/Config';
import { GitGuiPanel } from './webview/GitGuiPanel';

export function activate(context: vscode.ExtensionContext) {
    logger.info('Git GUI extension is now active');

    // Set debug mode based on configuration
    const logLevel = Config.getLogLevel();
    logger.setDebugMode(logLevel === 'debug');

    // 获取工作区根目录
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        const message = 'No workspace folder found';
        logger.warn(message);
        // Don't show error on activation, just log it
        return;
    }

    try {
        // 初始化 Git 服务
        const gitService = new GitService(workspaceFolder.uri.fsPath);

        // 注册命令
        context.subscriptions.push(
            vscode.commands.registerCommand('gitGui.open', () => {
                logger.debug('Open command triggered');
                GitGuiPanel.createOrShow(context.extensionUri, gitService);
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('gitGui.refresh', () => {
                logger.debug('Refresh command triggered');
                GitGuiPanel.refresh();
            })
        );

        logger.info('Git GUI extension activated successfully');
    } catch (error) {
        logger.error('Failed to activate extension', error);
        vscode.window.showErrorMessage(`Git GUI: Failed to activate - ${error}`);
    }
}

export function deactivate() {
    logger.info('Git GUI extension deactivated');
}
