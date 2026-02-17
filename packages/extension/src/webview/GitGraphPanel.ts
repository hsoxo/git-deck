import * as vscode from 'vscode';
import { GitService } from '../git/GitService';
import { logger } from '../utils/Logger';

export class GitGraphPanel {
    public static currentPanel: GitGraphPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, gitService: GitService) {
        const column = vscode.ViewColumn.One;

        // If we already have a panel, show it
        if (GitGraphPanel.currentPanel) {
            GitGraphPanel.currentPanel._panel.reveal(column);
            GitGraphPanel.currentPanel.refresh();
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'gitGraph',
            'Git Graph',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webview-dist')
                ],
            }
        );

        GitGraphPanel.currentPanel = new GitGraphPanel(panel, extensionUri, gitService);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        private extensionUri: vscode.Uri,
        private gitService: GitService
    ) {
        this._panel = panel;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'getGraphData':
                        await this.sendGraphData();
                        break;
                    case 'cherryPick':
                        await this.handleCherryPick(message.commits);
                        break;
                    case 'rebase':
                        await this.handleRebase(message.branch);
                        break;
                    case 'merge':
                        await this.handleMerge(message.branch);
                        break;
                    case 'checkout':
                        await this.handleCheckout(message.branch);
                        break;
                    case 'revert':
                        await this.handleRevert(message.commit);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public async refresh() {
        await this.sendGraphData();
    }

    private async sendGraphData() {
        try {
            const commits = await this.gitService.getGraphLog(100);
            const branches = await this.gitService.getBranches();
            const currentBranch = await this.gitService.getCurrentBranch();

            this._panel.webview.postMessage({
                type: 'graphData',
                commits,
                branches,
                currentBranch,
            });
        } catch (error) {
            logger.error('Failed to get graph data', error);
            this._panel.webview.postMessage({
                type: 'error',
                message: `Failed to load git graph: ${error}`,
            });
        }
    }

    private async _update() {
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
        // 告诉 webview 显示 graph 视图
        setTimeout(() => {
            this._panel.webview.postMessage({ type: 'setView', view: 'graph' });
            this.sendGraphData();
        }, 100);
    }

    private async handleCherryPick(commits: string[]) {
        try {
            await this.gitService.cherryPick(commits);
            vscode.window.showInformationMessage(`Cherry-picked commits: ${commits.join(', ')}`);
            await this.sendGraphData();
        } catch (error) {
            logger.error('Failed to cherry-pick', error);
            vscode.window.showErrorMessage(`Failed to cherry-pick: ${error}`);
        }
    }

    private async handleRebase(branch: string) {
        try {
            const answer = await vscode.window.showWarningMessage(
                `Rebase current branch onto ${branch}?`,
                { modal: true },
                'Rebase',
                'Interactive Rebase'
            );

            if (answer === 'Rebase') {
                await this.gitService.rebase(branch, false);
                vscode.window.showInformationMessage(`Rebased onto: ${branch}`);
                await this.sendGraphData();
            } else if (answer === 'Interactive Rebase') {
                await this.gitService.rebase(branch, true);
                vscode.window.showInformationMessage(`Interactive rebase onto: ${branch}`);
                await this.sendGraphData();
            }
        } catch (error) {
            logger.error('Failed to rebase', error);
            vscode.window.showErrorMessage(`Failed to rebase: ${error}`);
        }
    }

    private async handleMerge(branch: string) {
        try {
            await this.gitService.mergeBranch(branch);
            vscode.window.showInformationMessage(`Merged branch: ${branch}`);
            await this.sendGraphData();
        } catch (error) {
            logger.error('Failed to merge', error);
            vscode.window.showErrorMessage(`Failed to merge: ${error}`);
        }
    }

    private async handleCheckout(branch: string) {
        try {
            await this.gitService.checkoutBranch(branch);
            vscode.window.showInformationMessage(`Checked out branch: ${branch}`);
            await this.sendGraphData();
        } catch (error) {
            logger.error('Failed to checkout', error);
            vscode.window.showErrorMessage(`Failed to checkout: ${error}`);
        }
    }

    private async handleRevert(commit: string) {
        try {
            const answer = await vscode.window.showWarningMessage(
                `Revert commit ${commit.substring(0, 7)}?`,
                { modal: true },
                'Revert'
            );

            if (answer === 'Revert') {
                await this.gitService.revertCommits([commit]);
                vscode.window.showInformationMessage(`Reverted commit: ${commit.substring(0, 7)}`);
                await this.sendGraphData();
            }
        } catch (error) {
            logger.error('Failed to revert', error);
            vscode.window.showErrorMessage(`Failed to revert: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'webview-dist');
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(webviewPath, 'assets', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(webviewPath, 'assets', 'git-graph.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource}; connect-src ${webview.cspSource};">
    <link rel="stylesheet" href="${styleUri}">
    <title>Git Graph</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #root {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        GitGraphPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
