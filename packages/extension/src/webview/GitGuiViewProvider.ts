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
import { RemoteOperations } from '../git/operations/RemoteOperations';
import simpleGit from 'simple-git';

export class GitGuiViewProvider implements vscode.WebviewViewProvider {
    private view?: vscode.WebviewView;
    private rpcServer: RPCServer;
    private stageOps: StageOperations;
    private rebaseOps: RebaseOperations;
    private cherryPickOps: CherryPickOperations;
    private stashOps: StashOperations;
    private revertOps: RevertOperations;
    private diffOps: DiffOperations;
    private logOps: LogOperations;
    private branchOps: BranchOperations;
    private remoteOps: RemoteOperations;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly gitService: GitService
    ) {
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
        this.remoteOps = new RemoteOperations(git);

        this.registerRPCHandlers();
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // 处理来自 webview 的消息
        webviewView.webview.onDidReceiveMessage(async (message) => {
            const response = await this.rpcServer.handle(message);
            webviewView.webview.postMessage(response);
        });
    }

    refresh(): void {
        if (this.view) {
            this.view.webview.postMessage({ method: 'refresh' });
        }
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

        // Remote 操作
        this.rpcServer.register('git.listRemotes', () => this.remoteOps.listRemotes());
        this.rpcServer.register('git.addRemote', (name, url) =>
            this.remoteOps.addRemote(name, url)
        );
        this.rpcServer.register('git.removeRemote', (name) => this.remoteOps.removeRemote(name));
        this.rpcServer.register('git.fetch', (remote, prune) =>
            this.remoteOps.fetch(remote, prune)
        );
        this.rpcServer.register('git.pull', (remote, branch, rebase) =>
            this.remoteOps.pull(remote, branch, rebase)
        );
        this.rpcServer.register('git.push', (remote, branch, force, setUpstream) =>
            this.remoteOps.push(remote, branch, force, setUpstream)
        );
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // 获取 webview 资源的 URI
        const webviewPath = vscode.Uri.joinPath(
            this.extensionUri,
            'webview-dist'
        );

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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource}; connect-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>Git GUI</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
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
