// 最简单的测试扩展
const vscode = require('vscode');

function activate(context) {
    console.log('Test extension activated!');

    let disposable = vscode.commands.registerCommand('gitGui.open', function () {
        vscode.window.showInformationMessage('Git GUI Open command works!');

        // 创建一个简单的 webview panel
        const panel = vscode.window.createWebviewPanel(
            'gitGuiTest',
            'Git GUI Test',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git GUI Test</title>
    <style>
        body {
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        h1 {
            color: #007acc;
        }
    </style>
</head>
<body>
    <h1>Git GUI Test Panel</h1>
    <p>If you can see this, the webview is working!</p>
    <p>Extension URI: Working</p>
    <p>Webview API: <span id="api-status">Checking...</span></p>
    <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('api-status').textContent = 'Available!';
        console.log('Webview loaded successfully');
    </script>
</body>
</html>`;
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
