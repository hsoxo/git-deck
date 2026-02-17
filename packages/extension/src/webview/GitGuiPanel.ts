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
import { logger } from '../utils/Logger';
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
    logger.info('Creating or showing Git GUI panel');

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (GitGuiPanel.currentPanel) {
      logger.debug('Reusing existing panel');
      GitGuiPanel.currentPanel.panel.reveal(column);
      return;
    }

    logger.debug('Creating new webview panel');
    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'gitGui',
      'Git GUI',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'webview-dist')
        ],
        retainContextWhenHidden: true,
      }
    );

    logger.info('Webview panel created successfully');
    GitGuiPanel.currentPanel = new GitGuiPanel(panel, extensionUri, gitService);
  }

  public static refresh() {
    if (GitGuiPanel.currentPanel) {
      GitGuiPanel.currentPanel.panel.webview.postMessage({ method: 'refresh' });
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, gitService: GitService) {
    logger.debug('Initializing GitGuiPanel constructor');

    this.panel = panel;
    this.extensionUri = extensionUri;
    this.gitService = gitService;
    this.rpcServer = new RPCServer();

    logger.debug(`Repository path: ${gitService.getRepoPath()}`);

    const git = simpleGit(gitService.getRepoPath());
    this.stageOps = new StageOperations(git);
    this.rebaseOps = new RebaseOperations(git, gitService.getRepoPath());
    this.cherryPickOps = new CherryPickOperations(git);
    this.stashOps = new StashOperations(git);
    this.revertOps = new RevertOperations(git);
    this.diffOps = new DiffOperations(git);
    this.logOps = new LogOperations(git);
    this.branchOps = new BranchOperations(git);

    logger.debug('Git operations initialized');

    this.registerRPCHandlers();
    logger.debug('RPC handlers registered');

    // Set the webview's initial html content
    logger.debug('Setting webview HTML content');
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);
    logger.info('Webview HTML content set successfully');

    // Listen for when the panel is disposed
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        logger.debug('Received message from webview', { method: message.method, id: message.id, params: message.params });
        try {
          const response = await this.rpcServer.handle(message);
          logger.debug('Sending response to webview', { id: response.id, hasError: !!response.error, resultType: typeof response.result });
          await this.panel.webview.postMessage(response);
          logger.debug('Response sent successfully', { id: response.id });
        } catch (error) {
          logger.error('Error handling webview message', error);
          // Send error response back to webview
          if (message.id) {
            await this.panel.webview.postMessage({
              id: message.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      },
      null,
      this.disposables
    );

    logger.info('GitGuiPanel initialized successfully');
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
    logger.debug(`Webview path: ${webviewPath.fsPath}`);

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewPath, 'assets', 'index.js')
    );

    logger.debug(`Script URI: ${scriptUri.toString()}`);

    // 使用 nonce 来增强安全性
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource}; connect-src ${webview.cspSource};">
  <title>Git GUI</title>
  <style>
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid var(--vscode-progressBar-background);
      border-top: 3px solid var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-text {
      margin-top: 20px;
      font-size: 14px;
    }
    .error-container {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .error-title {
      color: var(--vscode-errorForeground);
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .error-message {
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div id="loading" class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">Loading Git GUI...</div>
  </div>
  <div id="error" class="error-container">
    <div class="error-title">Failed to Load Git GUI</div>
    <div class="error-message" id="error-message"></div>
  </div>
  <div id="root"></div>
  <script nonce="${nonce}">
    console.log('[Git GUI HTML] Script block loaded');
    console.log('[Git GUI HTML] acquireVsCodeApi available:', typeof acquireVsCodeApi !== 'undefined');
    
    // 不要在这里调用 acquireVsCodeApi，让 React 应用自己调用
    
    // 设置超时检测
    setTimeout(() => {
      const root = document.getElementById('root');
      const loading = document.getElementById('loading');
      const error = document.getElementById('error');
      const errorMessage = document.getElementById('error-message');
      
      console.log('[Git GUI HTML] Timeout check - root has children:', root && root.hasChildNodes());
      
      if (!root || !root.hasChildNodes()) {
        console.error('Git GUI failed to load after 10 seconds');
        if (loading) loading.style.display = 'none';
        if (error) {
          error.style.display = 'flex';
          errorMessage.textContent = 'The application failed to load. Please check the console for errors and try reloading the window.';
        }
      }
    }, 10000);
    
    // 监听错误
    window.addEventListener('error', (e) => {
      console.error('Git GUI Error:', e.error);
      console.error('Error stack:', e.error?.stack);
      const loading = document.getElementById('loading');
      const error = document.getElementById('error');
      const errorMessage = document.getElementById('error-message');
      
      if (loading) loading.style.display = 'none';
      if (error) {
        error.style.display = 'flex';
        errorMessage.textContent = e.error?.message || 'An unknown error occurred';
      }
    });
    
    // 监听加载完成
    window.addEventListener('DOMContentLoaded', () => {
      console.log('Git GUI: DOM loaded');
    });
    
    // 监听消息
    window.addEventListener('message', (event) => {
      console.log('[Git GUI HTML] Received message:', event.data);
    });
  </script>
  <script nonce="${nonce}" src="${scriptUri}" onerror="console.error('Failed to load script:', '${scriptUri}')"></script>
  <script nonce="${nonce}">
    // 额外的错误监听
    window.addEventListener('unhandledrejection', function(event) {
      console.error('[Git GUI] Unhandled promise rejection:', event.reason);
    });
  </script>
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
