import * as vscode from 'vscode';

export class GitGuiWelcomeView implements vscode.WebviewViewProvider {
    public static readonly viewType = 'gitGui.welcome';

    constructor(private readonly extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
                case 'openGitGui':
                    vscode.commands.executeCommand('gitGui.open');
                    break;
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Git GUI</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
        .welcome-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .welcome-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .welcome-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.5;
            margin-bottom: 16px;
        }
        .action-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            text-align: center;
            transition: background 0.2s;
        }
        .action-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 16px 0;
        }
        .feature-list li {
            padding: 6px 0;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        .feature-list li:before {
            content: "✓ ";
            color: var(--vscode-charts-green);
            font-weight: bold;
            margin-right: 8px;
        }
        .info-box {
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            padding: 12px;
            margin: 16px 0;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        <div class="welcome-title">🎨 Git GUI</div>
        <div class="welcome-description">
            Visual Git management tool for VS Code with graphical commit history and intuitive operations.
        </div>
        
        <button class="action-button" onclick="openGitGui()">
            Open Git GUI
        </button>
        
        <div class="info-box">
            <strong>💡 Tip:</strong> You can also open Git GUI from the Command Palette (Ctrl+Shift+P) by searching for "Git GUI: Open"
        </div>
        
        <div style="margin-top: 8px;">
            <strong style="font-size: 14px;">Features:</strong>
            <ul class="feature-list">
                <li>Visual commit history with graph</li>
                <li>Stage & commit management</li>
                <li>Rebase & cherry-pick operations</li>
                <li>Branch management</li>
                <li>Stash management</li>
                <li>Diff viewer</li>
            </ul>
        </div>
    </div>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        function openGitGui() {
            vscode.postMessage({ type: 'openGitGui' });
        }
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
