import * as vscode from 'vscode';
import { GitService } from '../git/GitService';
import { RPCServer } from '../rpc/RPCServer';
import { StageOperations } from '../git/operations/StageOperations';
import { RebaseOperations } from '../git/operations/RebaseOperations';
import { CherryPickOperations } from '../git/operations/CherryPickOperations';
import { StashOperations } from '../git/operations/StashOperations';
import { RevertOperations } from '../git/operations/RevertOperations';
import { DiffOperations } from '../git/operations/DiffOperations';
import { LogOperations } from '../git/operations/LogOperations';
import { BranchOperations } from '../git/operations/BranchOperations';
import simpleGit from 'simple-git';

export class GitGuiPanel {
    public static currentPanel: GitGuiPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly gitService: GitService;
    private readonly rpcServer: RPCServer;
    private readonly stageOps: StageOperations;
    private readonly rebaseOps: RebaseOperations;
    private readonly cherryPickOps: CherryPickOperations;
    private readonly stashOps: StashOperations;
    private readonly revertOps: RevertOperations;
    private readonly diffOps: DiffOperations;
    private readonly logOps: LogOperations;
    private readonly branchOps: BranchOperations;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, gitService: GitService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (GitGuiPanel.currentPanel) {
            GitGuiPanel.currentPanel.panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'gitGui',
            'Git GUI',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true,
            }
        );

        GitGuiPanel.currentPanel = new GitGuiPanel(panel, extensionUri, gitService);
    }

    public static refresh() {
        if (GitGuiPanel.currentPanel) {
            GitGuiPanel.currentPanel.panel.webview.postMessage({ method: 'refresh' });
        }
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, gitService: GitService) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.gitService = gitService;
        this.rpcServer = new RPCServer();

        const git = simpleGit(gitService.getRepoPath());
        this.stageOps = new StageOperations(git);
        this.rebaseOps = new RebaseOperations(git, gitService.getRepoPath());
        this.cherryPickOps = new CherryPickOperations(git);
        this.stashOps = new StashOperations(git);
        this.revertOps = new RevertOperations(git);
        this.diffOps = new DiffOperations(git);
        this.logOps = new LogOperations(git);
        this.branchOps = new BranchOperations(git);

        this.registerRPCHandlers();

        // Set the webview's initial html content
        this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                const response = await this.rpcServer.handle(message);
                this.panel.webview.postMessage(response);
            },
            null,
            this.disposables
        );
    }

    private registerRPCHandlers(): void {
        // Git 状态
        this.rpcServer.register('git.getStatus', () => this.gitService.getStatus());
        this.rpcServer.register('git.getLog', (options) => this.gitService.getLog(options));
        this.rpcServer.register('git.getBranches', () => this.gitService.getBranches());

        // Stage 操作
        this.rpcServer.register('git.stageFiles', (files) => this.stageOps.stage(files));
        this.rpcServer.register('git.unstageFiles', (files) => this.stageOps.unstage(files));
        this.rpcServer.register('git.stageAll', () => this.stageOps.stageAll());
        this.rpcServer.register('git.unstageAll', () => this.stageOps.unstageAll());
        this.rpcServer.register('git.commit', (message) => this.stageOps.commit(message));
        this.rpcServer.register('git.discard', (files) => this.stageOps.discard(files));

        // Rebase 操作
        this.rpcServer.register('git.rebase', (onto, interactive) =>
            this.rebaseOps.rebase(onto, interactive)
        );
        this.rpcServer.register('git.interactiveRebase', (onto, commits) =>
            this.rebaseOps.interactiveRebase(onto, commits)
        );
        this.rpcServer.register('git.rebaseContinue', () => this.rebaseOps.continue());
        this.rpcServer.register('git.rebaseAbort', () => this.rebaseOps.abort());
        this.rpcServer.register('git.rebaseSkip', () => this.rebaseOps.skip());
        this.rpcServer.register('git.rebaseEditCommit', (message) =>
            this.rebaseOps.editCommit(message)
        );
        this.rpcServer.register('git.getRebaseState', () => this.rebaseOps.getState());
        this.rpcServer.register('git.isRebasing', () => this.rebaseOps.isRebasing());
        this.rpcServer.register('git.getRebaseProgress', () => this.rebaseOps.getRebaseProgress());
        this.rpcServer.register('git.getRebaseCommits', (onto) =>
            this.rebaseOps.getRebaseCommits(onto)
        );

        // Cherry-pick 操作
        this.rpcServer.register('git.cherryPick', (commits) =>
            this.cherryPickOps.cherryPick(commits)
        );
        this.rpcServer.register('git.cherryPickContinue', () => this.cherryPickOps.continue());
        this.rpcServer.register('git.cherryPickAbort', () => this.cherryPickOps.abort());
        this.rpcServer.register('git.getCherryPickState', () => this.cherryPickOps.getState());

        // Stash 操作
        this.rpcServer.register('git.stashList', () => this.stashOps.list());
        this.rpcServer.register('git.stashPush', (message, includeUntracked) =>
            this.stashOps.push(message, includeUntracked)
        );
        this.rpcServer.register('git.stashPop', (index) => this.stashOps.pop(index));
        this.rpcServer.register('git.stashApply', (index) => this.stashOps.apply(index));
        this.rpcServer.register('git.stashDrop', (index) => this.stashOps.drop(index));
        this.rpcServer.register('git.stashClear', () => this.stashOps.clear());

        // Revert 操作
        this.rpcServer.register('git.revert', (commits) => this.revertOps.revert(commits));
        this.rpcServer.register('git.revertNoCommit', (commit) =>
            this.revertOps.revertNoCommit(commit)
        );
        this.rpcServer.register('git.revertContinue', () => this.revertOps.continue());
        this.rpcServer.register('git.revertAbort', () => this.revertOps.abort());

        // Diff 操作
        this.rpcServer.register('git.getFileDiff', (file, staged) =>
            this.diffOps.getFileDiff(file, staged)
        );
        this.rpcServer.register('git.getDiffStats', () => this.diffOps.getDiffStats());
        this.rpcServer.register('git.getStagedDiffStats', () => this.diffOps.getStagedDiffStats());
        this.rpcServer.register('git.getCommitChanges', (commit) =>
            this.diffOps.getCommitChanges(commit)
        );

        // Amend commit
        this.rpcServer.register('git.amendCommit', (message) =>
            this.gitService.amendCommit(message)
        );

        // Log 操作
        this.rpcServer.register('git.getCommitLog', (options) => this.logOps.getLog(options));
        this.rpcServer.register('git.getGraphLog', (options) => this.logOps.getGraphLog(options));
        this.rpcServer.register('git.getCommitDetails', (hash) =>
            this.logOps.getCommitDetails(hash)
        );
        this.rpcServer.register('git.getCommitFiles', (hash) => this.logOps.getCommitFiles(hash));
        this.rpcServer.register('git.getCommitStats', (hash) => this.logOps.getCommitStats(hash));
        this.rpcServer.register('git.searchCommits', (query, options) =>
            this.logOps.searchCommits(query, options)
        );
        this.rpcServer.register('git.getCommitsByAuthor', (author, options) =>
            this.logOps.getCommitsByAuthor(author, options)
        );
        this.rpcServer.register('git.getCommitsByDateRange', (since, until, options) =>
            this.logOps.getCommitsByDateRange(new Date(since), new Date(until), options)
        );

        // Branch 操作
        this.rpcServer.register('git.listBranches', () => this.branchOps.listBranches());
        this.rpcServer.register('git.createBranch', (name, startPoint) =>
            this.branchOps.createBranch(name, startPoint)
        );
        this.rpcServer.register('git.deleteBranch', (name, force) =>
            this.branchOps.deleteBranch(name, force)
        );
        this.rpcServer.register('git.renameBranch', (oldName, newName, force) =>
            this.branchOps.renameBranch(oldName, newName, force)
        );
        this.rpcServer.register('git.checkoutBranch', (name, create) =>
            this.branchOps.checkoutBranch(name, create)
        );
        this.rpcServer.register('git.mergeBranch', (branch, noFastForward) =>
            this.branchOps.mergeBranch(branch, noFastForward)
        );
        this.rpcServer.register('git.getCurrentBranch', () => this.branchOps.getCurrentBranch());
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // 获取 webview 资源的 URI
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'webview-dist');

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(webviewPath, 'assets', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(webviewPath, 'assets', 'index.css')
        );

        // 使用 nonce 来增强安全性
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>Git GUI</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        GitGuiPanel.currentPanel = undefined;

        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
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
