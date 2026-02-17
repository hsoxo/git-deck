import * as vscode from 'vscode';
import { GitService } from '../git/GitService';
import { logger } from '../utils/Logger';

export class CommitView implements vscode.WebviewViewProvider {
    public static readonly viewType = 'gitGui.commitView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly gitService: GitService,
        private readonly onRefresh: () => void
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'commit':
                    await this.handleCommit(data.message, false);
                    break;
                case 'commitAmend':
                    await this.handleCommit(data.message, true);
                    break;
                case 'push':
                    await this.handlePush(false);
                    break;
                case 'pushForce':
                    await this.handlePush(true);
                    break;
                case 'ready':
                    await this.updateView();
                    break;
            }
        });

        // Update view when it becomes visible
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.updateView();
            }
        });
    }

    public async refresh() {
        await this.updateView();
    }

    private async updateView() {
        if (!this._view) {
            return;
        }

        try {
            const status = await this.gitService.getStatus();
            const commits = await this.gitService.getLog({ maxCount: 1 });
            const branch = await this.gitService.getCurrentBranch();

            // Check if branch is ahead of origin
            const aheadBehind = await this.getAheadBehind();

            this._view.webview.postMessage({
                type: 'update',
                data: {
                    stagedCount: status.staged.length,
                    lastCommitMessage: commits.length > 0 ? commits[0].message : '',
                    branch: branch,
                    ahead: aheadBehind.ahead,
                    behind: aheadBehind.behind,
                    hasRemote: aheadBehind.hasRemote
                }
            });
        } catch (error) {
            logger.error('Failed to update commit view', error);
        }
    }

    private async getAheadBehind(): Promise<{ ahead: number; behind: number; hasRemote: boolean }> {
        try {
            const branch = await this.gitService.getCurrentBranch();
            // Try to get ahead/behind info
            // This is a simplified version - you may need to implement this in GitService
            return { ahead: 0, behind: 0, hasRemote: true };
        } catch (error) {
            return { ahead: 0, behind: 0, hasRemote: false };
        }
    }

    private async handleCommit(message: string, amend: boolean) {
        try {
            if (!message || message.trim().length === 0) {
                vscode.window.showWarningMessage('Commit message cannot be empty');
                return;
            }

            if (amend) {
                await this.gitService.amendCommit(message);
                vscode.window.showInformationMessage(`Amended commit: ${message}`);
            } else {
                const status = await this.gitService.getStatus();
                if (status.staged.length === 0) {
                    vscode.window.showWarningMessage('No staged changes to commit');
                    return;
                }
                await this.gitService.commit(message);
                vscode.window.showInformationMessage(`Committed: ${message}`);
            }

            this.onRefresh();
            await this.updateView();
        } catch (error) {
            logger.error('Failed to commit', error);
            vscode.window.showErrorMessage(`Failed to commit: ${error}`);
        }
    }

    private async handlePush(force: boolean) {
        try {
            if (force) {
                const answer = await vscode.window.showWarningMessage(
                    'Are you sure you want to force push? This can overwrite remote changes.',
                    { modal: true },
                    'Force Push'
                );
                if (answer !== 'Force Push') {
                    return;
                }
            }

            await this.gitService.push(force);
            vscode.window.showInformationMessage(force ? 'Force pushed successfully' : 'Pushed successfully');
            await this.updateView();
        } catch (error) {
            logger.error('Failed to push', error);
            vscode.window.showErrorMessage(`Failed to push: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource};">
    <title>Commit</title>
    <style>
        body {
            padding: 8px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
        }
        .commit-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .commit-input {
            width: 100%;
            min-height: 60px;
            padding: 8px;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            resize: vertical;
            box-sizing: border-box;
        }
        .commit-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        .button-row {
            display: flex;
            gap: 4px;
            align-items: stretch;
        }
        .button {
            flex: 1;
            min-width: 0;
            padding: 6px 12px;
            font-size: 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .button:hover:not(:disabled) {
            background-color: var(--vscode-button-hoverBackground);
        }
        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .button-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button-secondary:hover:not(:disabled) {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .dropdown {
            position: relative;
            display: flex;
            flex-shrink: 0;
        }
        .dropdown-toggle {
            padding: 6px 8px;
            min-width: 28px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .dropdown-toggle:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .dropdown-menu {
            display: none;
            position: absolute;
            bottom: 100%;
            left: 0;
            background-color: var(--vscode-menu-background);
            border: 1px solid var(--vscode-menu-border);
            border-radius: 2px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            min-width: 120px;
            margin-bottom: 4px;
        }
        .dropdown-menu.show {
            display: block;
        }
        .dropdown-item {
            padding: 6px 12px;
            cursor: pointer;
            font-size: 12px;
            color: var(--vscode-menu-foreground);
        }
        .dropdown-item:hover {
            background-color: var(--vscode-menu-selectionBackground);
            color: var(--vscode-menu-selectionForeground);
        }
        .info-text {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="commit-container">
        <textarea 
            id="commitMessage" 
            class="commit-input" 
            placeholder="Commit message..."
            rows="3"
        ></textarea>
        
        <div class="button-row">
            <button id="commitBtn" class="button">Commit</button>
            <div class="dropdown">
                <button id="commitDropdown" class="dropdown-toggle">▼</button>
                <div id="commitMenu" class="dropdown-menu">
                    <div class="dropdown-item" data-action="amend">Commit (Amend)</div>
                </div>
            </div>
        </div>

        <div id="pushRow" class="button-row hidden">
            <button id="pushBtn" class="button button-secondary">Push</button>
            <div class="dropdown">
                <button id="pushDropdown" class="dropdown-toggle">▼</button>
                <div id="pushMenu" class="dropdown-menu">
                    <div class="dropdown-item" data-action="force">Force Push</div>
                </div>
            </div>
        </div>

        <div id="infoText" class="info-text"></div>
    </div>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        const commitMessage = document.getElementById('commitMessage');
        const commitBtn = document.getElementById('commitBtn');
        const commitDropdown = document.getElementById('commitDropdown');
        const commitMenu = document.getElementById('commitMenu');
        const pushRow = document.getElementById('pushRow');
        const pushBtn = document.getElementById('pushBtn');
        const pushDropdown = document.getElementById('pushDropdown');
        const pushMenu = document.getElementById('pushMenu');
        const infoText = document.getElementById('infoText');

        let currentData = null;

        // Commit button
        commitBtn.addEventListener('click', () => {
            const message = commitMessage.value.trim();
            if (message) {
                vscode.postMessage({ type: 'commit', message });
                commitMessage.value = '';
            }
        });

        // Commit dropdown
        commitDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            commitMenu.classList.toggle('show');
            pushMenu.classList.remove('show');
        });

        commitMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'amend') {
                const message = commitMessage.value.trim() || currentData?.lastCommitMessage || '';
                if (message) {
                    vscode.postMessage({ type: 'commitAmend', message });
                    commitMessage.value = '';
                }
            }
            commitMenu.classList.remove('show');
        });

        // Push button
        pushBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'push' });
        });

        // Push dropdown
        pushDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            pushMenu.classList.toggle('show');
            commitMenu.classList.remove('show');
        });

        pushMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'force') {
                vscode.postMessage({ type: 'pushForce' });
            }
            pushMenu.classList.remove('show');
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            commitMenu.classList.remove('show');
            pushMenu.classList.remove('show');
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                currentData = message.data;
                updateUI(message.data);
            }
        });

        function updateUI(data) {
            // Update info text
            let info = \`\${data.stagedCount} staged\`;
            if (data.branch) {
                info += \` • \${data.branch}\`;
            }
            infoText.textContent = info;

            // Show/hide push button
            if (data.ahead > 0 || !data.hasRemote) {
                pushRow.classList.remove('hidden');
                if (data.ahead > 0) {
                    pushBtn.textContent = \`Push (\${data.ahead})\`;
                } else {
                    pushBtn.textContent = 'Publish Branch';
                }
            } else {
                pushRow.classList.add('hidden');
            }

            // Enable/disable commit button
            commitBtn.disabled = data.stagedCount === 0;
        }

        // Notify ready
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
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
